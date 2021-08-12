const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const playersRoutes = require("./routes/players-routes");
const ofertasRoutes = require("./routes/ofertas-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/players", playersRoutes);
app.use("/api/ofertas", ofertasRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

const connectUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.taxmw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const connectConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

mongoose
  .connect(connectUrl, connectConfig)
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });