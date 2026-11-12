import express from "express";
import {
  createTour,
  deleteTour,
  getAllTours,
  getTour,
  updateTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan
} from "../controllers/tourController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// router.param("id", (req, res, next, value) => {
//   console.log(`Tour id is: ${value}`);

//   next();
// });

router.route("/tour-stats")
  .get(getTourStats)

router.route("/monthly-plan/:year")
  .get(getMonthlyPlan)

router.route("/top-5-cheap")
  .get(aliasTopTours, getAllTours)

router.route("/")
  .get(protect, getAllTours)
  .post(createTour);

router.route("/:id")
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

export default router;
