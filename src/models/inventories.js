module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define("Inventories", {
    item: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
    },
  });

  return Inventory;
};
