const Extra = require("../../../models/Extra");
const ExtraTranslation = require("../../../models/ExtraTranslation");
const ProductVariantsExtras = require("../../../models/ProductVariantsExtras");
const ProductVariants = require("../../../models/Variant");

// GET
// Extra létrehozás oldal betöltése
exports.getAddExtra = async (req, res, next) => {
  try {
    res.render("product-conf/edit-extra", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// POST
// Extra létrehozása
exports.postAddExtra = async (req, res, next) => {
  const roName = req.body.roName;
  const huName = req.body.huName;
  const price = req.body.price;
  let restaurantId = req.admin.id;
  let extraId;

  // Szerver oldali validáció
  if (roName.length == 0 || huName.length == 0 || price.length == 0) {
    return res.redirect("/admin/extras");
  }

  try {
    // Extra létrehozása
    async function createExtra() {
      const extra = await Extra.create({
        // extraType: extraType,
        price: price,
        restaurantId: restaurantId,
      });
      extraId = extra.id;

      await ExtraTranslation.create({
        name: roName,
        languageId: 1,
        extraId: extraId,
      });
      await ExtraTranslation.create({
        name: huName,
        languageId: 2,
        extraId: extraId,
      });

      await ExtraTranslation.create({
        name: roName,
        languageId: 3,
        extraId: extraId,
      });
    }

    // Az újonnan létrehozott extrát hozzá rendelem nem aktívként az összes variánsokhoz
    async function addExtraToVariant() {
      const variants = await ProductVariants.findAll({
        where: { restaurantId: restaurantId },
      });

      for (let i = 0; i < variants.length; i++) {
        let variantId = [];
        let extraIdNew = [];

        variantId = variants[i].id;
        extraIdNew = extraId;

        await ProductVariantsExtras.create({
          active: 0,
          restaurantId: restaurantId,
          extraId: extraIdNew,
          discountedPrice: 0,
          price: 0,
          // extraType: extraType,
          variantId: variantId,
          requiredExtra: 0,
        });
      }
    }

    await createExtra();
    await addExtraToVariant();

    res.redirect("/admin/extras");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// GET
// Extra szerkesztés oldal betöltése
exports.getEditExtra = async (req, res, next) => {
  const editMode = req.query.edit;
  const extraId = req.params.extraId;
  const restaurantId = req.admin.id;

  // Szerver oldali validáció
  await Extra.findOne({
    where: { id: extraId, restaurantId: req.admin.id },
  }).then((extras) => {
    if (!extras) {
      return res.redirect("/admin/extras");
    }
  });

  try {
    const extra = await Extra.findAll({
      where: {
        id: extraId,
        restaurantId: restaurantId,
      },
      include: [
        {
          model: ExtraTranslation,
        },
      ],
    });

    // Átadom a lekért adatokat a HTML oldalnak
    res.render("product-conf/edit-extra", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      extra: extra,
      extraId: extraId,
      extraTranslation: extra[0].ExtraTranslations,
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// POST
// Extra frissítése
exports.postEditExtra = async (req, res, next) => {
  const roName = req.body.roName;
  const huName = req.body.huName;
  const price = req.body.price;
  const extraId = req.body.extraId;

  // Szerver oldali validáció
  if (roName.length == 0 || huName.length == 0 || price.length == 0) {
    return res.redirect("/admin/extras");
  }

  try {
    // Extra szerkesztése
    async function updateExtra() {
      await Extra.update({ price: price }, { where: { id: extraId } });

      await ExtraTranslation.update(
        { name: roName },
        { where: { extraId: extraId, languageId: 1 } }
      );

      await ExtraTranslation.update(
        { name: huName },
        { where: { extraId: extraId, languageId: 2 } }
      );

      await ExtraTranslation.update(
        { name: roName },
        { where: { extraId: extraId, languageId: 3 } }
      );
    }

    await updateExtra();

    res.redirect("/admin/extras");
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
