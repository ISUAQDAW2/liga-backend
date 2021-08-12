const express = require("express");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");

const playersControllers = require("../controllers/players-controllers");

const router = express.Router();

router.get("/get/:pid", playersControllers.getPlayerById);

router.get("/user/:uid", playersControllers.getPlayersByUserId);

router.get("/mercado", playersControllers.getPlayersMercado);

router.get("/get/ofertasrealizadas", playersControllers.getPlayers);

router.use(checkAuth);

router.post(
  "/",
  [
    check("title").not().isEmpty(),
    check("clausula").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  playersControllers.createPlayer
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("clausula").isLength({ min: 5 })],
  playersControllers.updatePlayer
);

router.delete("/:pid", playersControllers.deletePlayer);

module.exports = router;
