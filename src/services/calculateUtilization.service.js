// src/utils/calculateUtilization.js

const orders = require("../models/orders");

const WORKDAY_MINUTES = 480;

const calculateUtilization = (
  department,
  numberOfOrders,
  materialConsumption
) => {
  // Utilization calculation based on the department
  const departmentUtilizationMap = {
    Design: (orders) => (orders * 180) / WORKDAY_MINUTES,
    Montage: (orders) => (orders * 20) / WORKDAY_MINUTES,
    Printing: (orders, materialConsumption) =>
      (orders * 9.6 * materialConsumption) / WORKDAY_MINUTES,
    Cutting: (orders, materialConsumption) =>
      (orders * 100 * materialConsumption) / WORKDAY_MINUTES,
    Delivery: (orders) => (orders * 40) / WORKDAY_MINUTES,
  };

  // Call the appropriate calculation based on the department
  const utilizationFunction = departmentUtilizationMap[department];
  return utilizationFunction
    ? utilizationFunction(numberOfOrders, materialConsumption)
    : 0;
};

module.exports = calculateUtilization;