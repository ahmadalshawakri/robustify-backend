module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define("Inventories", {
    // ItemId will be set up via associations
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
