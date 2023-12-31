const express = require("express");
const PurchaseController = require("../controllers/purchaseController");
const authAdmin = require("../middleware/jwt");

const { validateNewPurchase } = require("../validation/purchaseValidation");

const router = express.Router();

router.post("/", [authAdmin, validateNewPurchase], PurchaseController.create);
router.get("/", [authAdmin], PurchaseController.list);
router.get("/:id", [authAdmin], PurchaseController.getById);
router.put("/:id", [authAdmin], PurchaseController.update);
router.delete("/:id", [authAdmin], PurchaseController.delete);

module.exports = router;
