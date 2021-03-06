const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const imageRoutes = require("./routes/image");
const userRoutes = require("./routes/user");
const xmlRoutes = require("./routes/xml");
const downloadXml = require("./routes/downloadXml");
const folderRoutes = require("./routes/folder");

const app = express();
console.log("app initiated");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/images", express.static(path.join("backend/images")));
app.use("/imagesxml", express.static(path.join("backend/imagesxml")));

app.use("/", express.static(path.join(__dirname, "OCR-WEB-UI")));

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
app.use("/api/xml", xmlRoutes);
app.use("/api/downloadXml", downloadXml);
app.use("/api/folder", folderRoutes);
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "OCR-WEB-UI", "index.html"));
});

module.exports = app;




