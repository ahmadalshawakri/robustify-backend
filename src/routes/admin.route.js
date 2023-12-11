const express = require("express");
const adminController = require("../controllers/adminController");
const { validateUser } = require("../validation/userValidation");
const authAdmin = require("../middleware/jwt");

const router = express.Router();

router.post("/", [authAdmin, validateUser], adminController.register);
router.get("/", authAdmin, adminController.list);
router.delete("/:id", authAdmin, adminController.delete);
// router.put("/:id", validateUser, adminController.register);

module.exports = router;
