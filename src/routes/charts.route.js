const express = require("express");
const ChartController = require("../controllers/chartsController");
const authAdmin = require("../middleware/jwt");

const router = express.Router();

router.get("/order-histogram", [authAdmin], ChartController.ordersHistogram);
router.get("/average-utilization", [authAdmin], ChartController.averageUtil);

module.exports = router;
