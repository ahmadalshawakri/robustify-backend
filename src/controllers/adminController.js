const { Users } = require("../models");
const { Utilizations } = require("../models");
const { hashPassword } = require("../services/hash.service");

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, department } = req.body;

    const hashedPassword = await hashPassword(password);

    const newUser = await Users.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department,
    });

    res.status(201).json(`User ${newUser.username} Registered Successfully`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Something Went Wrong, Please Check your Inputs");
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
      include:
        utilization === "true"
          ? [
              {
                model: Utilizations,
                attributes: ["utilizationRate", "timestamp"],
                // Assuming you want the latest utilization record for each user
                order: [["timestamp", "DESC"]],
                limit: 1,
              },
            ]
          : [],
    });

    const formattedUsers = users.map((user) => {
      const userJson = user.toJSON();
      if (user.Utilization && user.Utilization.length > 0) {
        userJson.utilization = user.Utilization[0].utilizationRate;
        userJson.utilizationTimestamp = user.Utilization[0].timestamp;
      }
      return userJson;
    });

    return res.status(200).json(formattedUsers);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  const user = await Users.findByPk(id);

  if (!user) return res.status(404).json("User Not Found!");

  return res.status(200).json(User.destroy({ where: { id } }));
};
