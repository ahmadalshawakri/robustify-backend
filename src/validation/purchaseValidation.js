const Joi = require("joi");
const { Items } = require("../constant/items.const");

const validItems = Object.values(Items).map((item) => {
  return { name: item.name, size: item.size };
});

const newPurchaseSchema = Joi.object({
  contactInfo: Joi.object({
    name: Joi.string().required(),
    location: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
  }).required(),
  item: Joi.object({
    itemName: Joi.string()
      .valid(...validItems.map((item) => item.name))
      .required(),
    itemSize: Joi.number()
      .valid(...validItems.map((item) => item.size))
      .required(),
    itemType: Joi.string(),
  }),
  quantity: Joi.number().required(),
  purchaseDate: Joi.date().required(),
  cost: Joi.number().required(),
  arrivalDate: Joi.date().required(),
});

const validateNewPurchase = (req, res, next) => {
  const { error } = newPurchaseSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: "Validation error",
      details: error.details.map((detail) => detail.message),
    });
  }
  next();
};

module.exports = { validateNewPurchase };
