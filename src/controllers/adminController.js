const { Users } = require("../models");
const { Orders } = require("../models");
const { hashPassword } = require("../services/hash.service");
const calculateUtilization = require("../services/calculateUtilization.service");

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, department } = req.body;

    const hashedPassword = await hashPassword(password);

    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
      role,
      department,
    });

    res.status(201).json(`${role} Registered Successfully`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Somthing Went Wrong, Please Check your Inputs");
  }
};

exports.list = async (req, res) => {
  const { department, utilization } = req.query;

  try {
    const whereClause = { role: "Employee" };
    if (department) {
      whereClause.department = department;
    }

    // Fetch users with potential filters
    const users = await Users.findAll({
      attributes: ["id", "username", "role", "department"],
      where: whereClause,
    });

    // If utilization query is true, calculate utilization
    if (utilization === "true") {
      const usersWithUtilizationPromises = users.map(async (user) => {
        const numberOfOrders = await Orders.count({
          where: { assignToId: user.id },
        });

        const totalMaterialConsumption = await Orders.sum("consumption", {
          where: { assignToId: user.id },
        });

        const userUtilization = calculateUtilization(
          user.department,
          numberOfOrders,
          totalMaterialConsumption
        );

        return {
          ...user.toJSON(),
          numberOfOrders,
          utilization: userUtilization,
        };
      });

      const usersWithUtilization = await Promise.all(
        usersWithUtilizationPromises
      );
      return res.status(200).json(usersWithUtilization);
    } else {
      // If utilization is not requested, return the basic user data
      return res.status(200).json(users);
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);

  if (!user) return res.status(404).json("User Not Found!");

  return res.status(200).json(User.destroy({ where: { id } }));
};
