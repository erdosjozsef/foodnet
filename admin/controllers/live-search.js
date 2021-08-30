const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const ProductVariants = require("../../models/Variant");
const ExtraTranslation = require("../../models/ExtraTranslation");
const Product = require("../../models/Product");
const ProductTranslation = require("../../models/ProductTranslation");
const ProductFinal = require("../../models/ProductFinal");
const Variant = require("../../models/Variant");
const Order = require("../../models/Order");
const Extra = require("../../models/Extra");
const OrderDeliveryAddress = require("../../models/OrderDeliveryAddress");
const LocationName = require("../../models/LocationName");
const LocationNameTranslation = require("../../models/LocationNameTranslation");
const OrderItem = require("../../models/OrderItem");
const OrderItemExtra = require("../../models/OrderItemExtra");
const User = require("../../models/User");

exports.getFilteredVariant = async (req, res, next) => {
  var variantName = req.params.variantId;

  if (variantName.length == 1) {
    variantName = [];
  }

  await ProductVariants.findAll({
    where: {
      sku: { [Op.like]: "%" + variantName + "%" },
      restaurantId: req.admin.id,
    },
  })

    .then((variant) => {
      res.render("live-search/variants", {
        variant: variant,
        editing: false,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getFilteredOrders = async (req, res, next) => {
  let languageCode;
  var orderId = req.params.orderId;
  if (orderId.length == 1) {
    orderId = [];
  }
  if (req.cookies.language == "ro") {
    languageCode = 1;
  } else if (req.cookies.language == "hu") {
    languageCode = 2;
  } else {
    languageCode = 3;
  }

  const orders = await Order.findAll({
    where: {
      orderStatusId: 1,
      restaurantId: req.admin.id,
      encodedKey: { [Op.like]: "%" + orderId + "%" },
    },
    include: [
      {
        model: OrderItem,

        include: [
          {
            model: OrderItemExtra,
            include: [
              {
                model: Extra,
                include: [
                  {
                    model: ExtraTranslation,
                    where: { languageId: languageCode },
                  },
                ],
              },
            ],
          },
          {
            model: Variant,
            include: [
              {
                model: ProductFinal,
                where: { active: 1 },
                include: [
                  {
                    model: Product,
                    include: [
                      {
                        model: ProductTranslation,
                        where: { languageId: languageCode },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { model: OrderDeliveryAddress },
      { model: User },

      {
        model: LocationName,
        include: [
          {
            model: LocationNameTranslation,
            where: { languageId: languageCode },
          },
        ],
      },
    ],
  });

  let extras = [];
  let cutlery;
  let take;
  let userName;
  let orderStreet;
  let orderHouseNumber;
  let orderFloor;
  let orderDoorNumber;
  let orderPhoneNumber;
  let orderCreated;
  let orderIds;
  let extrasArray = [];
  if (orders.length != 0) {
    for (let i = 0; i < orders.length; i++) {
      const resultWithAll = [];
      let orderItems = orders[i].OrderItems;

      for (let j = 0; j < orderItems.length; j++) {
        extras = orderItems[j].OrderItemExtras;
        //
        let prodFin = orderItems[j].Variant.ProductFinals;
        for (let h = 0; h < prodFin.length; h++) {
          if (extras.length == 0) {
            let totalProductPrice = 0;

            totalProductPrice +=
              parseFloat(orderItems[j].variantPrice) *
              parseInt(orderItems[j].quantity);
            const items = {
              variant_sku: orderItems[j].Variant.sku,
              extra_length: extras.length,
              product_id: prodFin[h].productId,
              product_quantity: orderItems[j].quantity,
              message: orderItems[j].message,
              product_price: orderItems[j].variantPrice,
              product_name: prodFin[h].Product.ProductTranslations[0].title,
              total_product_price: totalProductPrice,
            };

            resultWithAll.push(items);
          } else {
            for (let k = 0; k < extras.length; k++) {
              extrasArray.push(extras[k]);
              let totalProductPrice = 0;
              let totalExtraPrice = 0;

              totalProductPrice +=
                parseFloat(orderItems[j].variantPrice) *
                parseInt(orderItems[j].quantity);
              totalExtraPrice +=
                parseFloat(extras[k].extraPrice) * parseInt(extras[k].quantity);
              const items = {
                variant_sku: orderItems[j].Variant.sku,

                extra_length: extras.length,
                product_id: prodFin[h].productId,
                product_quantity: orderItems[j].quantity,
                product_price: orderItems[j].variantPrice,
                product_name: prodFin[h].Product.ProductTranslations[0].title,
                extra_id: extras[k].extraId,
                extra_quantity: extras[k].quantity,
                extra_price: extras[k].extraPrice,
                extra_name: extras[k].Extra.ExtraTranslations[0].name,
                total_product_price: totalProductPrice,
                total_extra_price: totalExtraPrice,
                message: orderItems[j].message,
              };

              resultWithAll.push(items);
            }
          }
        }
      }

      const merged = resultWithAll.reduce(
        (
          r,
          {
            product_id,
            product_quantity,
            product_price,
            product_name,
            total_product_price,
            message,
            extra_length,
            variant_sku,
            ...rest
          }
        ) => {
          const key = `${product_id}-${product_quantity}-${product_price}-${product_name}-${total_product_price}-${message}-${extra_length}-${variant_sku}`;
          r[key] = r[key] || {
            product_id,
            product_quantity,
            product_price,
            product_name,
            total_product_price,
            message,
            extra_length,
            variant_sku,
            extras: [],
          };
          r[key]["extras"].push(rest);
          return r;
        },
        {}
      );

      const result = Object.values(merged);
      orders[i].products = result;
    }
    totalPriceFinal = orders[0].totalPrice;
    cutlery = orders[0].cutlery;
    take = orders[0].take;
    orderStreet = orders[0].OrderDeliveryAddress.street;
    orderHouseNumber = orders[0].OrderDeliveryAddress.houseNumber;
    orderFloor = orders[0].OrderDeliveryAddress.floor;
    orderDoorNumber = orders[0].OrderDeliveryAddress.doorNumber;
    orderPhoneNumber = orders[0].OrderDeliveryAddress.phoneNumber;
    orderCreated = orders[0].createdAt.toLocaleString("en-GB", {
      timeZone: "Europe/Helsinki",
    });

    userName = orders[0].OrderDeliveryAddress.userName;
    orderIds = orders[0].encodedKey;
  }
  res.render("live-search/search-orders", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    orders: orders,
    orderStreet: orderStreet,
    orderHouseNumber: orderHouseNumber,
    orderFloor: orderFloor,
    orderDoorNumber: orderDoorNumber,
    orderPhoneNumber: orderPhoneNumber,
    orderCreated: orderCreated,
    userName: userName,
    cutlery: cutlery,
    take: take,
    orderIds: orderIds,
    extras: extras,
  });
};

exports.getFilteredAcceptedOrders = async (req, res, next) => {
  let languageCode;

  var orderId = req.params.orderId;
  if (orderId.length == 1) {
    orderId = [];
  }
  if (req.cookies.language == "ro") {
    languageCode = 1;
  } else if (req.cookies.language == "hu") {
    languageCode = 2;
  } else {
    languageCode = 3;
  }
  const orders = await Order.findAll({
    order: [["createdAt", "DESC"]],
    where: {
      orderStatusId: 2,
      restaurantId: req.admin.id,
      encodedKey: { [Op.like]: "%" + orderId + "%" },
    },
    include: [
      {
        model: OrderItem,

        include: [
          {
            model: OrderItemExtra,
            include: [
              {
                model: Extra,
                include: [
                  {
                    model: ExtraTranslation,
                    where: { languageId: languageCode },
                  },
                ],
              },
            ],
          },

          {
            model: Variant,
            include: [
              {
                model: ProductFinal,
                where: { active: 1 },
                include: [
                  {
                    model: Product,
                    include: [
                      {
                        model: ProductTranslation,
                        where: { languageId: languageCode },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { model: OrderDeliveryAddress },
      { model: User },

      {
        model: LocationName,
        include: [
          {
            model: LocationNameTranslation,
            where: { languageId: languageCode },
          },
        ],
      },
    ],
  });

  let extras = [];
  let cutlery;
  let take;
  let userName;
  let orderStreet;
  let orderHouseNumber;
  let orderFloor;
  let orderDoorNumber;
  let orderPhoneNumber;
  let orderCreated;
  let orderIds;

  if (orders.length != 0) {
    for (let i = 0; i < orders.length; i++) {
      const resultWithAll = [];
      let orderItems = orders[i].OrderItems;

      for (let j = 0; j < orderItems.length; j++) {
        extras = orderItems[j].OrderItemExtras;

        let prodFin = orderItems[j].Variant.ProductFinals;
        for (let h = 0; h < prodFin.length; h++) {
          if (extras.length == 0) {
            console.log("az");
            let totalProductPrice = 0;
            let totalBoxPrice = 0;
            totalProductPrice +=
              parseFloat(orderItems[j].variantPrice) *
              parseInt(orderItems[j].quantity);
            totalBoxPrice +=
              parseFloat(orderItems[j].boxPrice) *
              parseInt(orderItems[j].quantity);
            const items = {
              orderItemId: orderItems[j].id,
              boxPrice: orderItems[j].boxPrice,
              totalBoxPrice: totalBoxPrice.toFixed(2),
              variant_sku: orderItems[j].Variant.sku,
              extra_length: extras.length,
              product_id: prodFin[h].productId,
              product_quantity: orderItems[j].quantity,
              message: orderItems[j].message,
              product_price: orderItems[j].variantPrice,
              product_name: prodFin[h].Product.ProductTranslations[0].title,
              total_product_price: totalProductPrice,
            };

            resultWithAll.push(items);
          } else {
            console.log("ex");
            for (let k = 0; k < extras.length; k++) {
              let totalExtraPrice = 0;
              let totalProductPrice = 0;
              let totalBoxPrice = 0;
              let totalSection = 0;
              let totalSectionNoBox = 0;

              totalExtraPrice +=
                parseFloat(extras[k].extraPrice) * parseInt(extras[k].quantity);

              totalProductPrice +=
                parseFloat(orderItems[j].variantPrice) *
                parseInt(orderItems[j].quantity);

              totalBoxPrice +=
                parseFloat(orderItems[j].boxPrice) *
                parseInt(orderItems[j].quantity);

              totalSection +=
                parseFloat(totalBoxPrice) +
                parseFloat(totalExtraPrice) +
                parseFloat(totalProductPrice);

              totalSectionNoBox +=
                parseFloat(totalExtraPrice) + parseFloat(totalProductPrice);

              const items = {
                orderItemId: orderItems[j].id,
                variant_sku: orderItems[j].Variant.sku,
                totalBoxPrice: totalBoxPrice.toFixed(2),
                boxPrice: orderItems[j].boxPrice,
                totalSection: totalSection,
                totalSectionNoBox: totalSectionNoBox,
                extra_length: extras.length,
                product_id: prodFin[h].productId,
                product_quantity: orderItems[j].quantity,
                product_price: orderItems[j].variantPrice,
                product_name: prodFin[h].Product.ProductTranslations[0].title,
                extra_id: extras[k].extraId,
                extra_quantity: extras[k].quantity,
                extra_price: extras[k].extraPrice,
                extra_name: extras[k].Extra.ExtraTranslations[0].name,
                total_product_price: totalProductPrice,
                total_extra_price: totalExtraPrice,
                message: orderItems[j].message,
              };

              resultWithAll.push(items);
            }
          }
        }
      }

      const reduced = resultWithAll.reduce((acc, val) => {
        const {
          extra_id,
          extra_quantity,
          extra_price,
          extra_name,
          ...otherFields
        } = val;

        const existing = acc.find(
          (item) => item.orderItemId === val.orderItemId
        );
        if (!existing) {
          acc.push({
            ...otherFields,
            extras: [
              {
                extra_id,
                extra_quantity,
                extra_price,
                extra_name,
              },
            ],
          });
          return acc;
        }

        existing.extras.push({
          extra_id,
          extra_quantity,
          extra_price,
          extra_name,
        });
        return acc;
      }, []);

      orders[i].products = reduced;
    }

    totalPriceFinal = orders[0].totalPrice;
    cutlery = orders[0].cutlery;
    take = orders[0].take;
    orderStreet = orders[0].OrderDeliveryAddress.street;
    orderHouseNumber = orders[0].OrderDeliveryAddress.houseNumber;
    orderFloor = orders[0].OrderDeliveryAddress.floor;
    orderDoorNumber = orders[0].OrderDeliveryAddress.doorNumber;
    orderPhoneNumber = orders[0].OrderDeliveryAddress.phoneNumber;
    orderCreated = orders[0].createdAt.toLocaleString("en-GB", {
      timeZone: "Europe/Helsinki",
    });

    userName = orders[0].OrderDeliveryAddress.userName;
    orderIds = orders[0].encodedKey;
  }
  res.render("live-search/search-acc-orders", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    orders: orders,
    orderStreet: orderStreet,
    orderHouseNumber: orderHouseNumber,
    orderFloor: orderFloor,
    orderDoorNumber: orderDoorNumber,
    orderPhoneNumber: orderPhoneNumber,
    orderCreated: orderCreated,
    userName: userName,
    cutlery: cutlery,
    take: take,
    orderIds: orderIds,
    extras: extras,
  });
};

