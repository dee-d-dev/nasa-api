const express = require("express");
const planetsRouter = express.Router();
const { httpGetAllPlanets } = require("./planet.controller");

planetsRouter.get("/", httpGetAllPlanets);

module.exports = planetsRouter;
