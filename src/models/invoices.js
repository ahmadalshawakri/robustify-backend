module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define("Invoices", {
    // OrderId will be set up via associations
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    grandTotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  return Invoice;
};
