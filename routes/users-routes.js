const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controllers");

const router = express.Router();

//router.get("/presupuesto/:uid", usersController.getUserPresupuesto);
//router.get("/venderclausula/:uid", usersController.getUserById);

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

router.patch(
  "/pagarclausula/:uid",
  //[check("title").not().isEmpty(), check("clausula").isLength({ min: 5 })],
  usersController.updateUser
);

router.post("/login", usersController.login);

module.exports = router;
