let request = require("supertest");
let app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("TEST LAUNCHES API", () => {
  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET /launches", () => {
    test("it should return 200", async () => {
      const response = await request(app).get("/launches").expect(200);
      expect(response.statusCode).toBe(200);
    });
  });

  describe("test POST /launches", () => {
    const completeLaunchData = {
      mission: "Space Explore",
      rocket: "Explorer IS1",
      launchDate: "September 9, 2030",
      target: "kepler-62 f",
    };

    const launchDataWithoutDate = {
      mission: "Space Explore",
      rocket: "Explorer IS1",
      target: "kepler-62 f",
    };

    const launchDataWithInvalidDate = {
      mission: "Space Explore",
      rocket: "Explorer IS1",
      launchDate: "invalid",
      target: "kepler-62 f",
    };

    test("it should return 201 created", async () => {
      const response = await request(app)
        .post("/launches")
        .send(completeLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    test("it should catch missing properties", async () => {
      const response = await request(app)
        .post("/launches")
        .send(launchDataWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "missing required launch property",
      });
    });

    test("it should catch invalid datess", async () => {
      const response = await request(app)
        .post("/launches")
        .send(launchDataWithInvalidDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Invalid date",
      });
    });
  });
});
