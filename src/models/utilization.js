module.exports = (sequelize, DataTypes) => {
  const Utilization = sequelize.define("Utilizations", {
    userId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    utilizationRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  return Utilization;
};
