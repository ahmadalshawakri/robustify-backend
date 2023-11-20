const Joi = require("joi");
const { Items } = require("../constant/items.const");

const validPaperType = Object.values(Items.paper.types).map(
  (type) => type.name
);

const newOrderSchema = Joi.object({
  contactInfo: Joi.object({
    name: Joi.string().required(),
    location: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
  }).required(),
  paperType: Joi.string()
    .valid(...validPaperType)
    .required(),
  quantity: Joi.number().required(),
  sizeInWidth: Joi.number().required(),
  sizeInHeight: Joi.number().required(),
  deadline: Joi.date(),
  consumption: Joi.number().required(),
  cost: Joi.number().required(),
  assignToId: Joi.number().required(),
});

const updateOrderSchema = Joi.object({
  assignToId: Joi.number().required(),
  status: Joi.string()
    .valid(
      "Design",
      "Montage",
      "Printing",
      "Cutting",
      "Delivery",
      "In Transit",
      "Completed"
    )
    .required(),
});

const validateNewOrder = (req, res, next) => {
  const { error } = newOrderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation error",
      details: error.details.map((detail) => detail.message),
    });
  }
  next();
};

const validateUpdateOrder = (req, res, next) => {
  const { error } = updateOrderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation error",
      details: error.details.map((detail) => detail.message),
    });
  }
  next();
};

module.exports = { validateNewOrder, validateUpdateOrder };
