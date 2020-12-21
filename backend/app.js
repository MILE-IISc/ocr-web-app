const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const imageRoutes = require("./routes/image");
const userRoutes = require("./routes/user");

const app = express();
//mongodb+srv://maithri:<password>@cluster0.xrhry.mongodb.net/<dbname>?retryWrites=true&w=majority
mongoose
  .connect("mongodb+srv://maithri:"+process.env.MONGO_ATLAS_PW+"@cluster0.xrhry.mongodb.net/<dbname>?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
  .then(() => {
    console.log("Connected to database!");
  })
  .catch(() => {
    console.log("Connection failed!");
  });


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/images", express.static(path.join("backend/images")));
app.use("/imagesxml", express.static(path.join("backend/imagesxml")));


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use("/api/image", imageRoutes);
app.use("/api/user", userRoutes);

module.exports = app;