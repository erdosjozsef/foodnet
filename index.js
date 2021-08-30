const express = require("express"),
  lingua = require("lingua");
const Admin = require("./models/Restaurant");
const errorController = require("./admin/controllers/error");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const multer = require("multer");
const path = require("path");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const sequelize = require("./util/database");
const { databaseConfig } = require("./util/database-config");
const app = express();
const db = require("./util/database");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
app.use(express.json({ extended: true }));

const sessionStore = new SequelizeStore({
  db: db,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 7 * 24 * 60 * 60 * 1000,
});

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

app.use(cookieParser());

// Init Middleware

app.use((req, res, next) => {
  if (!req.session.admin) {
    return next();
  }
  Admin.findByPk(req.session.admin.id)

    .then((admin) => {
      req.admin = admin;
      next();
    })
    .catch((err) => console.log(err));
});

sessionStore.sync();


// File upload
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// EJS
app.set("view engine", "ejs");
app.set("views", "views");

// Routes config
const adminRoutes = require("./admin/routes/admin");
const indexRoutes = require("./admin/routes/index");
const authRoutes = require("./admin/routes/auth");
const superRoutes = require("./admin/routes/super-admin");

// Multi lang
app.use(
  lingua(app, {
    defaultLocale: "en",
    path: __dirname + "/i18n",
    cookieOptions: {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
);

// Define Routes
app.use("/admin", adminRoutes);
app.use("/super-admin", superRoutes);
app.use(indexRoutes);
app.use(authRoutes);
app.get("/500", errorController.get500);

// Database configuration
databaseConfig();

app.use((error, req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

// Config PORT
const PORT = process.env.PORT || 3000;
app.use(errorController.get404);
//
sequelize
  // .sync({ force: true })
  //
  .sync()
  .then((result) => {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });
