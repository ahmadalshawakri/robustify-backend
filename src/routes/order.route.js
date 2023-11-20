const express = require("express");
const OrderController = require("../controllers/orderController");
const {
  validateNewOrder,
  validateUpdateOrder,
} = require("../validation/orderValidation");
const authAdmin = require("../middleware/jwt");

const router = express.Router();

router.post("/", [authAdmin, validateNewOrder], OrderController.create);
router.get("/", [authAdmin], OrderController.list);
router.get("/:id", [authAdmin], OrderController.getById);
router.put("/:id", [authAdmin, validateUpdateOrder], OrderController.update);
router.delete("/:id", [authAdmin], OrderController.delete);

module.exports = router;
