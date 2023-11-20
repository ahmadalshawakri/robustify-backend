const { Orders, Contacts } = require("../models");

exports.create = async (req, res) => {
  const {
    contactInfo,
    paperType,
    quantity,
    sizeInWidth,
    sizeInHeight,
    deadline,
    consumption,
    cost,
    assignToId,
  } = req.body;

  try {
    const [contact, created] = await Contacts.findOrCreate({
      where: { email: contactInfo?.email },
      defaults: {
        type: "Customer",
        name: contactInfo?.name,
        email: contactInfo?.email,
        location: contactInfo?.location,
        phone: contactInfo?.phone,
      },
    });

    const order = await Orders.create({
      paperType,
      quantity,
      sizeInHeight,
      sizeInWidth,
      deadline,
      consumption,
      cost,
      assignToId,
      customerId: contact.id,
      status: "Not Started",
    });
    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

exports.list = async (req, res) => {
  try {
    const orders = await Orders.findAll({
      include: [
        {
          model: Contacts,
          as: "Customer",
          attributes: ["name", "phone", "email"],
        },
      ],
      attributes: ["id", "quantity", "consumption", "cost", "status"],
    });
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Orders.findByPk(orderId, {
      include: [
        {
          model: Contacts,
          as: "Customer",
          attributes: ["name", "email", "phone"],
        },
      ],
      attributes: ["id", "quantity", "consumption", "cost", "status"],
    });
    if (!order) return res.status(404).json("Order Not Found");

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

exports.update = async (req, res) => {
  const orderId = req.params.id;
  const { assignToId, status } = req.body;

  try {
    const order = await Orders.findByPk(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Update specific fields
    order.assignToId = assignToId;
    order.status = status;

    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.delete = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Orders.findByPk(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    await order.destroy();

    res.status(200).send("Order has been deleted.");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
