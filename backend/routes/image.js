const express = require("express");
const fs = require("fs");
var path = require('path');
var format = require('xml-formatter');
const WaveController = require("../controllers/waves");
const Image = require("../models/image");
const User = require("../models/user");

const checkAuth = require("../middleware/check-auth");
// const extractFile = require("../middleware/file"); extractFile, 

const router = express.Router();
const multer = require('multer');
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/tiff": "tif"
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let fetchedUser;
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          return res.status(401).json({
            message: "Auth failed"
          });
        }
        fetchedUser = user;
      }).then(() => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        // console.log("file name "+file.originalname);
        // console.log("book name "+bookName);
        const image_wav_dir = './backend/images/' + req.body.email + '/'
        let error = new Error("Invalid mime type");
        var fs = require('fs');
        let dir = image_wav_dir;
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (isValid) {
          error = null;
        }

        cb(error, dir);
      });
  },
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-");
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name);
  }
});


router.post("", checkAuth,
  multer({ storage: storage }).array("image", 4000),
  (req, res, next) => {
    let imageList = [];
    let fetchedUser;
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          return res.status(401).json({
            message: "Auth failed"
          });
        }
        fetchedUser = user;
      }).then(() => {
        const url = req.protocol + "://" + req.get("host");
        const user_wav_dir = './backend/images/' + req.body.email
        console.log("user wave directory " + user_wav_dir)
        fs.readdir(user_wav_dir, (err, filesList) => {
          if (err) {
            console.log("error in filelist  " + err);
            imageList = "";
            res.status(500).json({
              message: "error in adding images",
            });
          } else {
            targetFiles = filesList;
            console.log("file list length " + filesList.length);
            res.status(201).json({
              message: "Images added successfully",
            });
          }
        });
      });
  });

router.put("/:id", checkAuth, (req, res, next) => {
  console.log("fileName" + req.body.fileName)
  imageFileName = req.body.fileName;
  editor = req.userData.email
  // editorId = req.userData.userId;

  // console.log("editorId" +editorid);

  xmlFileName = imageFileName.slice(0, -3) + 'xml';

  const user_xml_dir = './backend/images/' + editor + '/';
  var fs = require('fs');
  let dir = user_xml_dir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  var xml = req.body.xml;

  var formattedXml = format(xml, {
    indentation: '  ',
    filter: (node) => node.type !== 'Comment',
    collapseContent: true,
    lineSeparator: '\n'
  });

  console.log(formattedXml);
  let writeStream = fs.createWriteStream(dir + xmlFileName);
  writeStream.on('error', (err) => {
    console.log(err);
    writeStream.end();
    res.status(500).json({
      message: "Couldn't save Text File. err: " + err
    });
  });
  writeStream.write(formattedXml);

  writeStream.on('finish', () => {
    console.log("imageFileName-----" + imageFileName);
    res.status(200).json({ message: "XML File saved successfully!", name: imageFileName, completed: "Y" });
  });
  writeStream.end();
});

router.get("", (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const mail = req.query.user;
  var fetchedImages = [];
  let fetchedUser;
  let imageArray = [];
  let imageList = [];
  let xmlArrayList = [];
  let completed;
  User.findOne({ email: mail })
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      console.log("user in get" + user.email)
      fetchedUser = user;
      const user_wav_dir = './backend/images/' + fetchedUser.email;
      var newFiles = [];
      fs.readdir(user_wav_dir, (err, filesList) => {
        if (err) {
          fetchedImages = "";
          res.status(201).json({
            message: "No image files",
            images: fetchedImages
          });
        }
        else {
          targetFiles = filesList;
          targetFiles.forEach(file => {
            if (path.extname(file).toLowerCase() != ".xml") {
              fetchedImages.push(file);
            } else {
              xmlArrayList.push(file);
            }
          });
          console.log("fetchedImages length " + fetchedImages.length)
          if (fetchedImages.length > 0) {
            fetchedImages.forEach(files => {
              const xmlFile = files.slice(0, -3) + 'xml';
              if (xmlArrayList.includes(xmlFile)) {
                completed = 'Y';
              } else {
                completed = 'N';
              }
              console.log("user email " + fetchedUser.email)
              const path = url + '/images/' + fetchedUser.email + '/' + files;
              const image = {
                _id: fetchedUser._id,
                fileName: files,
                imagePath: path,
                completed: completed,
                editor: fetchedUser._id
              };
              imageList.push(image);
              imageList.sort((a, b) => a.fileName.localeCompare(b.fileName));
            });
            res.status(201).json({
              message: "Images fetched successfully!",
              images: imageList
            });
            console.log("imageList length " + imageList.length);
          } else {
            imageList = "";
            res.status(201).json({
              message: "No image files",
              images: imageList
            });
          }
        }
      });
    });
});
module.exports = router;
