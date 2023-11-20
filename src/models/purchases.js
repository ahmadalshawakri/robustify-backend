module.exports = (sequelize, DataTypes) => {
  const Purchase = sequelize.define("Purchases", {
    // Item will be associated with an Item table/model
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATE,
    },
    arrivalDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.INTEGER,
    },
    // SupplierId will be set up via associations
  });

  return Purchase;
};
