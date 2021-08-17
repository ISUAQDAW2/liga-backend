const express = require("express");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const messagesControllers = require("../controllers/messages-controllers");

const router = express.Router();

router.get("/get", messagesControllers.getMessages);

router.use(checkAuth);

router.post("/post", messagesControllers.createMessage);

module.exports = router;
