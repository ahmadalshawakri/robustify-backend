module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define("Contacts", {
    type: {
      type: DataTypes.ENUM("Customer", "Supplier"),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  return Contact;
};
