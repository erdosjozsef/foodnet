const Order = require("../../models/Order");
const OrderDeliveryAddress = require("../../models/OrderDeliveryAddress");
const LocationName = require("../../models/LocationName");
const LocationNameTranslation = require("../../models/LocationNameTranslation");
const OrderItem = require("../../models/OrderItem");
const OrderItemExtra = require("../../models/OrderItemExtra");
const User = require("../../models/User");
const Variant = require("../../models/Variant");
const ProductFinal = require("../../models/ProductFinal");
const Product = require("../../models/Product");
const ProductTranslation = require("../../models/ProductTranslation");
const Extra = require("../../models/Extra");
const ExtraTranslation = require("../../models/ExtraTranslation");
const Restaurant = require("../../models/Restaurant");
const RestaurantRole = require("../../models/RestaurantRole");
const mailgun = require("mailgun-js");
const DOMAIN = "xxxxx";
const api_key = "xxxxx";
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const mg = mailgun({
  apiKey: api_key,
  domain: DOMAIN,
  host: "xxxxx",
});

exports.postDeleteOrder = async (req, res, next) => {
  let orderId = req.params.id;
  const order = await Order.findOne({
    where: {
      id: orderId,
    },
    include: [{ model: OrderDeliveryAddress }],
  });
  let userEmail = order.OrderDeliveryAddress.email;
  const restaurant = await Restaurant.findByPk(req.admin.id);

  try {
    await Order.update({ orderStatusId: 6 }, { where: { id: orderId } });

    async function sendEmailForMe() {
      const data = {
        from: "info@foodnet.ro",
        to: "erdosjozsef20@gmail.com",
        subject: "Egy rendelés törlésre került!",
        html: `<p>A ${restaurant.fullName} étterem töröltt egy rendelést (id: ${orderId}).</p>
        <p>Törlés oka: ${req.body.reject}.</p>`,
      };

      await mg.messages().send(data, function (error, body) {
        if (error) {
          console.log(error);
        }
      });
    }

    async function sendEmailForUser() {
      const data = {
        from: "info@foodnet.ro",
        to: userEmail,
        subject: "Elutasított rendelés",
        html: `<h1>Email template</h1>`,
      };

      await mg.messages().send(data, function (error, body) {
        if (error) {
          console.log(error);
        }
      });
    }
    await sendEmailForUser();
    await sendEmailForMe();

    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  const userRole = await Restaurant.findOne({
    where: { id: req.admin.id },
    include: [{ model: RestaurantRole }],
  });
  let userRoleType = userRole.RestaurantRoles[0].role;
  let languageCode;
  if (req.cookies.language == "ro") {
    languageCode = 1;
  } else if (req.cookies.language == "hu") {
    languageCode = 2;
  } else {
    languageCode = 3;
  }
  let reqAdmin = req.admin.id;
  const orderfirst = await getOrderByStatus(1, reqAdmin, languageCode);
  const ordersecond = await getOrderByStatus(2, reqAdmin, languageCode);
  const orderthird = await getOrderByStatus(3, reqAdmin, languageCode);
  const orderfour = await getOrderByStatus(4, reqAdmin, languageCode);
  const orderfive = await getOrderByStatus(5, reqAdmin, languageCode);

  if (userRoleType != 0) {
    res.redirect("/admin/courier-orders");
  }

  res.render("order/orders", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    orderfirst: orderfirst,
    ordersecond: ordersecond,
    orderthird: orderthird,
    orderfour: orderfour,
    orderfive: orderfive,
    userRole: userRoleType,
    needDelivery: userRole.needDelivery,
  });
};
const getOrderByStatus = async (status, reqAdmin, languageCode, req, res) => {
  const TODAY_START = new Date().setHours(0, 0, 0, 0);
  const NOW = new Date();

  const orders = await Order.findAll({
    order: [["createdAt", "DESC"]],
    where: {
      orderStatusId: status,
      restaurantId: reqAdmin,
      createdAt: {
        [Op.gt]: TODAY_START,
        [Op.lt]: NOW,
      },
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

  if (orders.length != 0) {
    for (let i = 0; i < orders.length; i++) {
      const resultWithAll = [];
      let orderItems = orders[i].OrderItems;
      for (let j = 0; j < orderItems.length; j++) {
        extras = orderItems[j].OrderItemExtras;
        let prodFin = orderItems[j].Variant.ProductFinals;
        for (let h = 0; h < prodFin.length; h++) {
          if (extras.length == 0) {
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
            for (let k = 0; k < extras.length; k++) {
              let totalExtraPrice = 0;
              let totalProductPrice = 0;
              let totalBoxPrice = 0;
              let totalSection = 0;
              let totalSectionNoBox = 0;
              let extraPlusProduct = 0;
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
      test = orders[i].products;
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
  // console.log(test);
  return { orders: orders };
};

exports.postEditOrderAjaxNext = async (req, res, next) => {
  let orderStatusId = req.body.orderStatusId;
  let orderId = req.body.orderId;

  const order = await Order.findOne({
    where: {
      id: orderId,
    },
    include: [{ model: OrderDeliveryAddress }],
  });
  let userEmail = order.OrderDeliveryAddress.email;

  if (orderStatusId == 2) {
    async function sendEmailForUser() {
      const data = {
        from: "info@foodnet.ro",
        to: userEmail,
        subject: "Sikeresen felvett rendelés!",
        html: `<h1>Email template design</h1>`,
      };

      await mg.messages().send(data, function (error, body) {
        if (error) {
          console.log(error);
        }
      });
    }
    await sendEmailForUser();
  }

  await Order.update(
    { orderStatusId: orderStatusId, courierId: req.admin.id },
    { where: { id: orderId } }
  );
};

exports.postEditOrderAjaxPrev = async (req, res, next) => {
  let orderStatusId = req.body.orderStatusId;
  let orderId = req.body.orderId;

  await Order.update(
    { orderStatusId: orderStatusId, courierId: req.admin.id },
    { where: { id: orderId } }
  );
};
