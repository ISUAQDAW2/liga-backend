const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const playersRoutes = require("./routes/players-routes");
const ofertasRoutes = require("./routes/ofertas-routes");
const usersRoutes = require("./routes/users-routes");
const messagesRoutes = require("./routes/messages-routes");
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
app.use("/api/messages", messagesRoutes);

app.use((req, res, next) => {
  const error = new HttpError("No se ha podido encontrar la ruta.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Ha ocurrido un error" });
});
const db_username = process.env.DB_USER;
const db_password = process.env.DB_PASSWORD;
const db_name = process.env.DB_NAME;

const connectUrl = `mongodb+srv://${db_username}:${db_password}@cluster0.taxmw.mongodb.net/${db_name}?retryWrites=true&w=majority`;
const connectConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

mongoose
  .connect(connectUrl, connectConfig)
  .then(() => {
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
