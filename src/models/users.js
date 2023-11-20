const { hashPassword } = require("../services/hash.service");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("Users", {
    // Define your model attributes here
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("Admin", "Employee"),
      allowNull: false,
    },
    department: {
      type: DataTypes.ENUM(
        "Design",
        "Montage",
        "Printing",
        "Cutting",
        "Delivery"
      ),
      allowNull: false,
    },
  });

  return User;
};
