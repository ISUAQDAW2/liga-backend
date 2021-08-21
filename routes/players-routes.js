const express = require("express");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");

const playersControllers = require("../controllers/players-controllers");

const router = express.Router();

router.get("/get/:pid", playersControllers.getPlayerById);

router.get("/user/:uid", playersControllers.getPlayersByUserId);

router.get("/mercado", playersControllers.getPlayersMercado);

router.get("/top/ofertasrealizadas", playersControllers.getPlayers);

router.use(checkAuth);

router.post(
  "/:pid",
  [
    check("title").not().isEmpty(),
    check("clausula").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  playersControllers.createPlayer
);

router.post(
  "/discarded/:uid",
  [
    check("title").not().isEmpty(),
    check("clausula").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  playersControllers.createDiscardedPlayer
);

router.patch(
  "/transferible/:pid",
  [check("transferible").not().isEmpty()],
  playersControllers.updateTransferiblePlayer
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("clausula").isLength({ min: 5 })],
  playersControllers.updatePlayer
);

router.delete("/:pid", playersControllers.deletePlayer);

router.delete("/delete/:pid/:uid", playersControllers.deleteDiscardedPlayer);

module.exports = router;
