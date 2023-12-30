module.exports = (sequelize, DataTypes) => {
  const Purchase = sequelize.define("Purchases", {
    item: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cost: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    arrivalDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Upcoming", "Booked", "Canceled", "Partial"),
      allowNull: true,
    },
  });

  return Purchase;
};
