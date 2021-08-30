module.exports = (req, res, next) => {
  if (
    req.admin.email !== "erdos.jozsef@foodnet.ro" &&
    req.admin.email !== "biro.ambrus.tunde@foodnet.ro"
  ) {
    return res.redirect("/");
  }
  next();
};
