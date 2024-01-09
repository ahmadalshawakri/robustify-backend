const { Purchases, Contacts } = require("../models");

exports.list = async (req, res) => {
  const { status } = req.query;
  let purchases;
  try {
    if (status) {
      purchases = await Purchases.findAll({
        include: [
          {
            model: Contacts,
            as: "Supplier",
            attributes: ["name", "phone"],
          },
        ],
        where: { status },
      });
    } else {
      purchases = await Purchases.findAll({
        include: [
          {
            model: Contacts,
            as: "Supplier",
            attributes: ["name", "phone"],
          },
        ],
      });
    }
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

    const purchase = await Purchases.create({
      item,
      quantity,
      purchaseDate,
      cost,
      arrivalDate,
      supplierId: contact.id,
      status: "Upcoming",
    });

    return res.status(201).json(purchase);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
exports.getById = async (req, res) => {
  try {
    const purchaseId = req.params.id;
    const purchase = await Purchases.findByPk(purchaseId, {
      include: [
        {
          model: Contacts,
          as: "Supplier",
          attributes: ["name", "phone"],
        },
      ],
    });

    if (!purchase) return res.status(404).json("Purchase Not Found");

    return res.status(200).json(purchase);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
exports.update = async (req, res) => {
  const purchaseId = req.params.id;
  const { quantity, status } = req.body;

  try {
    const purchase = await Purchases.findByPk(purchaseId);

    if (!purchase) return res.status(404).json("Purchase not found");

    purchase.quantity = quantity;
    purchase.status = status;

    await purchase.save();

    return res.status(201).json(purchase);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.delete = async (req, res) => {
  const purchaseId = req.params.id;
  try {
    const purchase = await Purchases.findByPk(purchaseId);

    if (!purchase) return res.status(404).json("Purchase Not Found");

    await purchase.destroy();

    return res.status(200).json("Purchase has been deleted");
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
