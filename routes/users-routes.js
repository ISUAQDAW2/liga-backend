const express = require("express");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const usersController = require("../controllers/users-controllers");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

router.use(checkAuth);

router.patch("/pagarclausula/:uid", usersController.updateUser);

module.exports = router;
