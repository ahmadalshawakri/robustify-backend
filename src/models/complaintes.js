module.exports = (sequelize, DataTypes) => {
  const Complaint = sequelize.define("Complaints", {
    // OrderId will be set up via associations
    // CustomerId will be set up via associations
    defect: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // ResponsibilityId will be set up via associations
    comment: {
      type: DataTypes.TEXT,
    },
  });

  return Complaint;
};
