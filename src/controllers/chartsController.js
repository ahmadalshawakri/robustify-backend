const { Orders, Users, sequelize, Utilizations } = require("../models");

exports.ordersHistogram = async (req, res) => {
  try {
    const ordersCount = await Orders.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("status")), "orderCount"],
      ],
      group: ["status"],
      raw: true,
    });
    let combinedCounts = {
      "In Progress": 0,
      "Not Started": 0,
      "In Transit": 0,
      Completed: 0,
    };

    ordersCount.forEach((order) => {
      if (
        ["Design", "Montage", "Printing", "Cutting", "Packaging"].includes(
          order.status
        )
      ) {
        combinedCounts["In Progress"] += parseInt(order.orderCount);
      } else {
        combinedCounts[order.status] = parseInt(order.orderCount);
      }
    });
    return res.status(200).json(combinedCounts);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

exports.averageUtil = async (req, res) => {
  try {
    const employeesCount = await Users.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "employeesCount"],
      ],
      where: { role: "Employee" },
      raw: true,
    });

    const utilizationSum = await Utilizations.sum("utilizationRate");

    const avg = utilizationSum / employeesCount[0].employeesCount;

    return res.status(200).json(avg.toFixed(1));
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
