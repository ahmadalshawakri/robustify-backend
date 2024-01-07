const Joi = require("joi");

// Define the schema for the user
const userSchema = Joi.object({
  username: Joi.string()
    .pattern(new RegExp("^[a-zA-Z]+\\.[a-zA-Z]+$"))
    .required()
    .messages({
      "string.pattern.base":
        "Username must be in the format: firstname.lastname",
    }),
  email: Joi.string()
    .email()
    .pattern(new RegExp("^[a-zA-Z]+\\.[a-zA-Z]+@mail\\.com$"))
    .required()
    .messages({
      "string.email": "Email must be a valid email",
      "string.pattern.base":
        "Email must be in the format: firstname.lastname@mail.com",
    }),
  password: Joi.string().required(),
  role: Joi.string().valid("Admin", "Employee").required(),
  department: Joi.string()
    .valid(
      "Administration",
      "Design",
      "Montage",
      "Printing",
      "Cutting",
      "Delivery"
    )
    .required(),
});

// Middleware for validating the user data
const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: "Validation error",
      details: error.details.map((detail) => detail.message),
    });
  }

  next();
};

module.exports = {
  validateUser,
};
