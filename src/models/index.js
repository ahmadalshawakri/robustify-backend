const { Sequelize } = require("sequelize");
const config = require("../config/config").development;
const UsersModel = require("./users");
const OrdersModel = require("./orders");
const PurchasesModel = require("./purchases");
const ContactsModel = require("./contacts");
const InventoriesModel = require("./inventories");
const InvoicesModel = require("./invoices");
const ComplaintsModel = require("./complaintes");

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: "postgres",
    logging: false,
  }
);

const Users = UsersModel(sequelize, Sequelize.DataTypes);
const Orders = OrdersModel(sequelize, Sequelize.DataTypes);
const Purchases = PurchasesModel(sequelize, Sequelize.DataTypes);
const Contacts = ContactsModel(sequelize, Sequelize.DataTypes);
const Inventories = InventoriesModel(sequelize, Sequelize.DataTypes);
const Invoices = InvoicesModel(sequelize, Sequelize.DataTypes);
const Complaintes = ComplaintsModel(sequelize, Sequelize.DataTypes);

function setupAssociations(sequelize) {
  const {
    Users,
    Contacts,
    Purchases,
    Orders,
    Inventories,
    Complaints,
    Invoices,
  } = sequelize.models;

  // Define associations here
  Users.hasMany(Orders, {
    as: "AssignedOrders",
    foreignKey: "assignToId",
  });
  Contacts.hasMany(Orders, {
    as: "CustomerOrders",
    foreignKey: "customerId",
  });
  Contacts.hasMany(Purchases, {
    as: "SupplierPurchases",
    foreignKey: "supplierId",
  });
  Orders.belongsTo(Users, {
    as: "AssignedTo",
    foreignKey: "assignToId",
  });
  Orders.belongsTo(Contacts, {
    as: "Customer",
    foreignKey: "customerId",
  });
  Orders.hasOne(Invoices, { foreignKey: "orderId" });
  Purchases.belongsTo(Contacts, {
    as: "Supplier",
    foreignKey: "supplierId",
  });
  Complaintes.belongsTo(Orders, { foreignKey: "orderId" });
  Complaintes.belongsTo(Contacts, {
    as: "Customer",
    foreignKey: "customerId",
  });
  Complaintes.belongsTo(Users, {
    as: "Responsibility",
    foreignKey: "responsibilityId",
  });
  Invoices.belongsTo(Orders, { foreignKey: "orderId" });
}

setupAssociations(sequelize);

sequelize
  .sync({ force: false }) // Change to true to drop tables first
  .then(() => {
    console.log("Database & tables created!");
  });

module.exports = {
  sequelize,
  Users,
  Orders,
  Purchases,
  Contacts,
  Inventories,
  Invoices,
  Complaintes,
};
