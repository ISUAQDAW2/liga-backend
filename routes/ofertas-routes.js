const express = require("express");
const { check } = require("express-validator");

const ofertasControllers = require("../controllers/ofertas-controllers");

const router = express.Router();

router.get("/mercado", ofertasControllers.getOfertasMercado);

router.get("/:pid", ofertasControllers.getOfertaById);

router.get("get/:uid", ofertasControllers.getOfertasByUserId);

router.get("/player/:oid", ofertasControllers.getOfertasByPlayerId);

router.post(
  "/",
  [
    check("title").not().isEmpty(),
    check("clausula").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  ofertasControllers.createOferta
);

router.patch(
  "/:pid",
  /* [check("title").not().isEmpty(), check("clausula").isLength({ min: 5 })], */
  ofertasControllers.updateOferta
);

router.delete("/:oid", ofertasControllers.deleteOferta);

module.exports = router;
