const ProductVariantsExtras = require("../../../models/ProductVariantsExtras");
const Variant = require("../../../models/Variant");
const Category = require("../../../models/Category");
const CategoryTranslation = require("../../../models/CategoryTranslation");
const Extras = require("../../../models/Extra");
const ExtraTranslations = require("../../../models/ExtraTranslation");
const ProductsFinal = require("../../../models/ProductFinal");
const Products = require("../../../models/Product");
const Sequelize = require("sequelize");
const CategoryProperty = require("../../../models/CategoryProperty");
const Property = require("../../../models/Property");
const PropertyValue = require("../../../models/PropertyValue");
const PropertyTranslation = require("../../../models/PropertyTranslation");
const PropertyValueTranslation = require("../../../models/PropertyValueTranslation");
const VariantPropertyValue = require("../../../models/VariantPropertyValue");
const Extra = require("../../../models/Extra");
const { getLanguageCode } = require("../../../shared/language");
// GET
// Variáns oldal létrehozás betöltése
exports.getAddVariant = async (req, res, next) => {
  // Változók deklarálása
  const languageCode = getLanguageCode(req.cookies.language);
  let restaurantId = req.admin.id;

  // Lekérem az étterem összes extráit
  const ext = await Extras.findAll({
    where: { restaurantId: restaurantId },
    include: [
      {
        model: ExtraTranslations,
        where: { languageId: languageCode },
      },
    ],
  });

  // Lekérem az étteremhez tartozó karegóriákat
  const cat = await Category.findAll({
    where: {
      restaurantId: restaurantId,
    },
    include: [
      {
        model: CategoryTranslation,
        where: { languageId: languageCode },
      },
    ],
  });

  // Le kell ellenőrizni, hogy az étteremnek van-e már létrehozva extra és kategóriája
  if (ext.length < 2 || cat.length < 2) {
    return res.redirect("/admin/variants");
  }

  // Átadom a lekért adatokat a HTML fájlnak
  res.render("product-conf/edit-variant", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    ext: ext,
    cat: cat,
  });
};

// POST
// Variáns létrehozáa
exports.postAddVariant = async (req, res, next) => {
  // Változók deklarálása
  const propertyId = req.body.propertyId;
  const propertyValueId = req.body.propertyValueId;
  const extId = req.body.extraId;
  const sku = req.body.sku;
  const categoryId = req.body.categoryId;
  const maxOption = req.body.maxOption;
  const filteredStatus = req.body.status.filter(Boolean);
  const filteredOptions = req.body.statusOption.filter(Boolean);
  const restaurantId = req.admin.id;
  let variantId;

  // Szerver oldali validáció
  if (extId.length == 0 || sku.length == 0) {
    return res.redirect("/admin/variants");
  }

  // Lekérem az étteremnek az extráit
  const ext = await Extras.findAll({
    where: { restaurantId: restaurantId },
    include: [
      {
        model: ExtraTranslations,
      },

      {
        model: ProductVariantsExtras,
        include: [
          {
            model: Variant,
          },
        ],
      },
    ],
  });

  // Lekérem az étteremnek a termékeit
  let productId = await Products.findAll({
    where: { restaurantId: restaurantId },
  });

  // Lekérem az étteremnek a kategóriáját
  const cat = await Category.findAll({
    where: { restaurantId: restaurantId },
    include: [
      {
        model: CategoryTranslation,
      },
    ],
  });

  try {
    // Variáns létrehozása
    async function createVariant() {
      const variant = await Variant.create({
        sku: sku,
        restaurantId: restaurantId,
        categoryId: categoryId,
        maxOption: maxOption,
      });
      variantId = variant.id;
    }

    // Az összes termékhez hozzáadom a létrehozott variánst
    async function createVariantToProductFinal() {
      for (let i = 0; i < productId.length; i++) {
        await ProductsFinal.create({
          price: 0,
          active: 0,
          productId: productId[i].id,
          variantId: variantId,
        });
      }
    }

    // Elmentem az extrákot a variánshoz
    async function createExtraToVariant() {
      for (let i = 0; i < ext.length; i++) {
        await ProductVariantsExtras.create({
          discountedPrice: 1,
          variantId: variantId,
          // extraType: ext[i].extraType,
          extraId: extId[i],
          active: filteredStatus[i] == "on" ? 1 : 0,
          restaurantId: restaurantId,
          requiredExtra: filteredOptions[i] == "on" ? 1 : 0,
        });
      }
    }

    // A variánshoz hozzá rendelem az alkategóriát
    async function createSubcategoryToVariant() {
      await VariantPropertyValue.create({
        variantId: variantId,
        propertyValueId: propertyValueId,
        propertyId: propertyId,
      });
    }

    await createVariant();
    await createVariantToProductFinal();
    await createExtraToVariant();
    await createSubcategoryToVariant();
    res.redirect("/admin/variants"),
      {
        ext: ext,
        cat: cat,
      };
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// GET
// Variáns oldal szerkesztés betöltése
exports.getEditVariant = async (req, res, next) => {
  const editMode = req.query.edit;
  const varId = req.params.variantId;
  const languageCode = getLanguageCode(req.cookies.language);

  await Variant.findOne({
    where: { id: varId, restaurantId: req.admin.id },
  }).then((extras) => {
    if (!extras) {
      return res.redirect("/admin/variants");
    }
  });

  const propertyValTransId = await VariantPropertyValue.findAll({
    where: { variantId: varId },
    include: [
      {
        model: PropertyValue,
      },
    ],
  });

  let categoryId;
  await Variant.findByPk(varId).then((variant) => {
    categoryId = variant.categoryId;
    if (!variant) {
      return res.redirect("/");
    }
  });
  const test3 = await Variant.findAll({
    where: { id: varId },
    include: [{ model: VariantPropertyValue }],
  });
  const productVarToExt = await Extras.findAll({
    where: { restaurantId: req.admin.id },
    include: [
      {
        model: ExtraTranslations,
        where: { languageId: languageCode },
      },

      { model: ProductVariantsExtras },
    ],
  });

  const ext = await Extras.findAll({
    where: { restaurantId: req.admin.id },
    include: [
      {
        model: ExtraTranslations,
        where: { languageId: languageCode },
      },
    ],
  });

  const result = await CategoryProperty.findAll({
    where: { id: categoryId },
    include: [
      {
        model: Property,
        include: [
          {
            model: PropertyTranslation,
            where: { languageId: languageCode },
          },
          {
            model: PropertyValue,
            include: [{ model: PropertyValueTranslation }],
          },
        ],
      },
    ],
  });

  const cat = await Category.findAll({
    where: { restaurantId: req.admin.id },
    include: [
      {
        model: CategoryTranslation,
        where: { languageId: languageCode },
      },
    ],
  });

  const resultProp = await CategoryProperty.findAll({
    where: { restaurantId: req.admin.id, categoryId: categoryId, active: 1 },
    include: [
      {
        model: Property,
        include: [
          {
            model: PropertyTranslation,
            where: { languageId: languageCode },
          },
          {
            model: PropertyValue,
            include: [
              {
                model: PropertyValueTranslation,
                where: { languageId: languageCode },
              },
            ],
          },
        ],
      },
    ],
  });

  await Extras.findAll({
    where: { restaurantId: req.admin.id },
    include: [
      {
        model: ExtraTranslations,
        where: { languageId: languageCode },
      },

      {
        model: ProductVariantsExtras,
        include: [
          {
            model: Variant,
            where: {
              variantId: varId,
            },
            where: {
              id: varId,
              restaurantId: req.admin.id,
            },
          },
        ],
      },
    ],
  })
    .then((variant) => {
      res.render("product-conf/edit-variant", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        varId: varId,
        variant: variant,
        variantIdByParams: varId,
        ext: ext,
        cat: cat,
        resultProp: resultProp,
        result: result,
        currentLanguage: 1,
        productVarToExt: productVarToExt,
        isActive: variant[0].ProductVariantsExtras,
        testing3: test3[0].VariantPropertyValues[0].propertyValueId,
        testActiveOk: propertyValTransId[0].propertyValueId,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      console.log(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// POST
// Variáns szerkesztése
exports.postEditVariant = async (req, res, next) => {
  // Változók deklarálása
  const extId = req.body.extraId;
  const updatedSku = req.body.sku;
  const varId = req.body.variantId;
  const filteredStatus = req.body.status.filter(Boolean);
  const filteredOptions = req.body.statusOption.filter(Boolean);
  const maxOption = req.body.maxOption;
  const categoryId = req.body.categoryId;
  const dasd = req.body.varId;
  let variantId = [dasd];
  const propertyValueId = req.body.propertyValueId;
  const propertyId = req.body.propertyId;
  const Op = Sequelize.Op;
  // Szerver oldali validáció
  if (extId.length == 0 || updatedSku.length == 0) {
    return res.redirect("/admin/variants");
  }

  // Lekérem a variánshoz rendelt extráit
  const productVarToExt = await ProductVariantsExtras.findAll({
    where: {
      variantId: {
        [Op.in]: variantId,
      },
    },
    include: [{ model: Extra }],
  });
  try {
    async function updateSubcategory() {
      // A variáns frissítése, ha frissül az alkategória
      await VariantPropertyValue.update(
        {
          propertyValueId: propertyValueId,
          propertyId: propertyId,
        },
        {
          where: {
            variantId: varId,
          },
        }
      );
    }

    async function updateVariant() {
      // Variáns frissítése
      await Variant.findByPk(varId).then((variant) => {
        variant.sku = updatedSku;
        variant.maxOption = maxOption;
        variant.categoryId = categoryId;
        return variant.save();
      });
    }

    async function updateExtras() {
      // Végigmegyek az extrákon és frissítem a ki-be jelöléseket
      for (let i = 0; i < productVarToExt.length; i++) {
        let extrasIds = [extId[i]];
        let variantId = [varId];

        // Extrák ki-be jelölése frissítése
        await ProductVariantsExtras.update(
          {
            discountedPrice: 1,
            active: filteredStatus[i] == "on" ? 1 : 0,
            requiredExtra: filteredOptions[i] == "on" ? 1 : 0,
          },
          {
            where: {
              extraId: {
                [Op.in]: extrasIds,
              },
              variantId: {
                [Op.in]: variantId,
              },
            },
          }
        );
      }
    }

    await updateSubcategory();
    await updateVariant();
    await updateExtras();

    res.redirect("/admin/variants");
  } catch (error) {
    console.log(error);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// GET
// Alkategóriák keresése categoryId alapján
exports.getFilteredProperty = async (req, res, next) => {
  // Változók deklarálása
  const languageCode = getLanguageCode(req.cookies.language);
  var categoryId = req.params.categoryId;
  let restaurantId = req.admin.id;

  // Alkategóriákhoz keresés
  const result = await CategoryProperty.findAll({
    where: { restaurantId: restaurantId, categoryId: categoryId, active: 1 },
    include: [
      {
        model: Property,
        include: [
          {
            model: PropertyTranslation,
            where: { languageId: languageCode },
          },
          {
            model: PropertyValue,
            include: [
              {
                model: PropertyValueTranslation,
                where: { languageId: languageCode },
              },
            ],
          },
        ],
      },
    ],
  });

  try {
    res.render("searchOnEditScreen/current-subcategories", {
      result: result,
      editing: false,
    });
  } catch (error) {
    console.log(error);
    error.httpStatusCode = 500;
    return next(error);
  }
};
