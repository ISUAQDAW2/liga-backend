const express = require("express");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const ofertasControllers = require("../controllers/ofertas-controllers");

const router = express.Router();

router.get("/mercado", ofertasControllers.getOfertasMercado);

router.get("/:pid", ofertasControllers.getOfertaById);

router.get("/player/:pid", ofertasControllers.getOfertasByPlayerId);

router.use(checkAuth);

router.get("/get/:q/:pid", ofertasControllers.getOfertasByUserId);

router.post(
  "/:clause/:q",
  [
    check("title").not().isEmpty(),
    check("clausula").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  ofertasControllers.createOferta
);

router.patch("/:oid/:clause/:q/:pid", ofertasControllers.updateOferta);

router.delete("/:oid", ofertasControllers.deleteOferta);

module.exports = router;
