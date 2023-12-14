module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Orders", {
    paperType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sizeInWidth: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    sizeInHeight: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    consumption: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "Not Started",
        "Design",
        "Montage",
        "Printing",
        "Cutting",
        "Packaging",
        "In Transit",
        "Completed"
      ),
      allowNull: true,
    },
  });

  return Order;
};
