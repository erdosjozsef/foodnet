const express = require("express");
const extraController = require("../controllers/products/extras");
const boxController = require("../controllers/products/boxes");
const ordersController = require("../controllers/order");
const upsellController = require("../controllers/products/upsells");
const isAuth = require("../../middleware/is-auth");
const router = express.Router();


// BOX
router.get("/add-box", isAuth, boxController.getAddBox);
router.post("/add-box", isAuth, boxController.postAddBox);
router.get("/edit-box/:boxId", isAuth, boxController.getEditBox);
router.post("/edit-box", isAuth, boxController.postEditBox);


// EXTRA
router.get("/add-extra", isAuth, extraController.getAddExtra);
router.get("/edit-extra/:extraId", isAuth, extraController.getEditExtra);
router.post("/edit-extra", isAuth, extraController.postEditExtra);
router.post("/add-extra", isAuth, extraController.postAddExtra);

// UPSELL
router.get("/add-upsell", isAuth, upsellController.getAddUpsellProduct);
router.post("/add-upsell", upsellController.postAddUpsellProduct);
router.get(
  "/edit-upsell/:productId",
  isAuth,
  upsellController.getEditUpsellProduct
);
router.post("/edit-upsell", isAuth, upsellController.postEditUpsellProduct);
router.post("/delete-order/:id", isAuth, ordersController.postDeleteOrder);


module.exports = router;
