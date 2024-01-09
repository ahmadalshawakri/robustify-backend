const { Orders, Contacts, Utilizations, Users } = require("../models");
const calculateUtilization = require("../services/calculateUtilization.service");

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

    if (assignToId) {
      const assignedUser = await Users.findByPk(assignToId);
      if (assignedUser) {
        const numberOfOrders = await Orders.count({
          where: { assignToId: assignedUser.id },
        });

        const totalMaterialConsumption = await Orders.sum("consumption", {
          where: { assignToId: assignedUser.id },
        });

        const newUtilizationRate = calculateUtilization(
          assignedUser.department,
          numberOfOrders,
          totalMaterialConsumption
        );

        // Update or create the utilization record
        await Utilizations.upsert({
          userId: assignedUser.id,
          utilizationRate: newUtilizationRate,
          timestamp: new Date(),
        });
      }
    }
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

    if (!order) return res.status(404).json("Order not found");

    const previousAssigneeId = order.assignToId;

    order.assignToId = assignToId;
    order.status = status;

    await order.save();

    if (assignToId && assignToId !== previousAssigneeId) {
      await updateUtilizationForUser(assignToId);
      if (previousAssigneeId) {
        await updateUtilizationForUser(previousAssigneeId);
      }
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).send(error.message);
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

const updateUtilizationForUser = async (userId) => {
  const numberOfOrders = await Orders.count({
    where: { assignToId: userId },
  });

  const totalMaterialConsumption = await Orders.sum("consumption", {
    where: { assignToId: userId },
  });

  const assignedUser = await Users.findByPk(userId);
  const newUtilizationRate = calculateUtilization(
    assignedUser.department,
    numberOfOrders,
    totalMaterialConsumption
  );

  await Utilizations.upsert({
    userId: userId,
    utilizationRate: newUtilizationRate,
    timestamp: new Date(),
  });
};
