// const launches = new Map();
const launchesDB = require("./launches.mongo");
const planets = require("./planets.mongo");
// const launches = new Map();
const axios = require("axios");

// let latestFlightNumber = 100;
const DEFAULT_FLIGHTNUMBER = 0;

const SPACEX_URL = "https://api.spacexdata.com/v4/launches/query";

// saveLaunch(launch);
// launches.set(launch.flightNumber, launch);

async function findLaunch(filter) {
  return await launchesDB.findOne(filter);
}

async function existLaunchWithId(launchId) {
  return await launchesDB.findOne({ flightNumber: launchId });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDB.findOne({}).sort("-flightNumber");
  if (!latestLaunch) {
    return DEFAULT_FLIGHTNUMBER;
  }
  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launchesDB
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

// function addNewLaunch(launch) {
//   latestFlightNumber++;
//   return launches.set(
//     latestFlightNumber,
//     Object.assign(launch, {
//       customer: ["GHOST", "NASA"],
//       upcoming: true,
//       success: true,
//       flightNumber: latestFlightNumber,
//     })
//   );
// }

async function scheduleNewLaunch(launch) {
  const planet = planets.findOne({ keplerName: launch.target });

  if (!planet) {
    throw new Error("no matching planet found");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;

  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customer: ["GHOST", "NASA"],
    flightNumber: newFlightNumber,
  });

  return await saveLaunch(newLaunch);
}

async function populateLaunches() {
  console.log("Downloading launches data...");
  const response = await axios.post(SPACEX_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status != 200) {
    console.log("There is a problem downloading data");
    throw new Error("Launch data download failed");
  }

  const launchDocs = response.data.docs;

  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchData: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };

    console.log(`${launch.mission} ${launch.flightNumber}`);

    await saveLaunch(launch);
  }
}

async function loadLaunchesData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch data already loaded");
  } else {
    await populateLaunches();
  }
}

async function saveLaunch(launch) {
  await launchesDB.updateOne({ flightNumber: launch.flightNumber }, launch, {
    upsert: true,
  });
}

async function abortLaunchById(launchId) {
  return await launchesDB.updateOne(
    { flightNumber: launchId },
    { upcoming: false, success: false }
  );
  // const aborted = launches.get(launchId);
  // aborted.upcoming = false;
  // aborted.success = false;

  // return aborted;
}
module.exports = {
  launchesDB,
  getAllLaunches,
  scheduleNewLaunch,
  existLaunchWithId,
  abortLaunchById,
  loadLaunchesData,
};
