const Allergen = require("../../../models/Allergen");
const AllergensTranslation = require("../../../models/AllergenTranslation");
const Product = require("../../../models/Product");
const ProductHasAllergen = require("../../../models/ProductHasAllergen");

// GET
// Allergén létrehozás oldal betöltése
exports.getAddAllergen = async (req, res, next) => {
  res.render("product-conf/edit-allergen", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
  });
};

// POST
// Allergén létrehozása
exports.postAddAllergen = async (req, res, next) => {
  const roName = req.body.roName;
  const huName = req.body.huName;
  const restaurantId = req.admin.id;
  let allergenId;

  // Szerver oldali validáció
  if (roName.length == 0 || huName.length == 0) {
    return res.redirect("/admin/allerges");
  }

  try {
    // Allergén létrehozása
    async function createAllergen() {
      allergen = await Allergen.create({
        restaurantId: restaurantId,
      });
      allergenId = allergen.id;

      await AllergensTranslation.create({
        name: roName,
        languageId: 1,
        allergenId: allergenId,
        restaurantId: restaurantId,
      });
      await AllergensTranslation.create({
        name: huName,
        languageId: 2,
        restaurantId: restaurantId,

        allergenId: allergenId,
      });

      await AllergensTranslation.create({
        name: roName,
        languageId: 3,
        allergenId: allergenId,
        restaurantId: restaurantId,
      });
    }

    // A létrehozott allergént is elmentem nem aktívként a ProductHasAllergen táblába
    async function createAllergenToProduct() {
      const totalProducts = await Product.findAll({
        where: { restaurantId: restaurantId },
      });

      for (let i = 0; i <= totalProducts.length - 1; i++) {
        await ProductHasAllergen.create({
          active: 0,
          restaurantId: restaurantId,
          allergenId: allergenId,
          productId: totalProducts[i].id,
        });
      }
    }

    await createAllergen();
    await createAllergenToProduct();

    res.redirect("/admin/allergens");
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// GET
// Allergén szerkesztés oldal betöltése
exports.getEditAllergen = async (req, res, next) => {
  const editMode = req.query.edit;
  const allergenId = req.params.allergenId;

  // Ha nem az étteremhez tartozik, akkor átírányítás
  await Allergen.findOne({
    where: { id: allergenId, restaurantId: req.admin.id },
  }).then((allergen) => {
    if (!allergen) {
      return res.redirect("/admin/allergens");
    }
  });

  try {
    // Megkeresen a szerkeszteni kívánt allergént
    const allergen = await Allergen.findAll({
      where: {
        id: allergenId,
      },
      include: [
        {
          model: AllergensTranslation,
        },
      ],
    });

    // Átadom az adatokat a HTML fájlnak
    res.render("product-conf/edit-allergen", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      allergen: allergen,
      allergenId: allergenId,
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// POST
// Allergén módosítása
exports.postEditAllergen = async (req, res, next) => {
  const updatedRoName = req.body.roName;
  const updatedHuName = req.body.huName;
  const allergenId = req.body.allergenId;

  // Szerver oldali validáció
  if (updatedRoName.length == 0 || updatedHuName.length == 0) {
    return res.redirect("/admin/allergens");
  }

  try {
    // Allergén módosítása
    async function updateAllergen() {
      await AllergensTranslation.update(
        { name: updatedRoName },
        { where: { allergenId: allergenId, languageId: 1 } }
      );

      await AllergensTranslation.update(
        { name: updatedHuName },
        { where: { allergenId: allergenId, languageId: 2 } }
      );

      await AllergensTranslation.update(
        { name: updatedRoName },
        { where: { allergenId: allergenId, languageId: 3 } }
      );
    }

    await updateAllergen();
    res.redirect("/admin/allergens");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
