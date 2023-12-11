const { Purchases, Contacts } = require("../models");

exports.list = async (req, res) => {
  try {
    const purchases = await Purchases.findAll({
      include: [
        {
          model: Contacts,
          as: "Supplier",
          attributes: ["name", "phone"],
        },
      ],
    });
    return res.status(200).json({ purchases });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
exports.create = async (req, res) => {
  const { contactInfo, item, quantity, purchaseDate, cost, arrivalDate } =
    req.body;

  try {
    const [contact, created] = await Contacts.findOrCreate({
      where: { email: contactInfo?.email },
      defaults: {
        type: "Supplier",
        name: contactInfo?.name,
        email: contactInfo?.email,
        location: contactInfo?.location,
        phone: contactInfo?.phone,
      },
    });
  } catch (error) {}
};
exports.getById = async (req, res) => {};
exports.update = async (req, res) => {};
exports.delete = async (req, res) => {};
