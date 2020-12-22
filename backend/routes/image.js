const express = require("express");
const fs = require("fs");
var path = require('path');
var format = require('xml-formatter');
const WaveController = require("../controllers/waves");
const Image = require("../models/image");
const User = require("../models/user");

const checkAuth = require("../middleware/check-auth");
// const extractFile = require("../middleware/file"); extractFile, 
// let dir;
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
        const image_wav_dir = './backend/images/' + req.body.email
        let error = new Error("Invalid mime type");
        var fs = require('fs');
        let dir = image_wav_dir;
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
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
  multer({ storage: storage }).array("image", 1000),
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
        const user_wav_dir = './backend/images/' + req.body.email;
        console.log("user wave directory " + user_wav_dir)
        fs.readdir(user_wav_dir, (err, filesList) => {
          if (err) {
            console.log("error in filelist  " + err);
            imageList = "";
          } else {
            targetFiles = filesList;
            console.log("file list length " + filesList.length);
            targetFiles.forEach((file, i) => {

              const image = {
                fileName: file,
                imagePath: url + '/images/' + req.body.email + '/' + file,
                completed: 'N',
                editor: fetchedUser._id
              };
              imageList.push(image);
            });
          }
          console.log("before posting to db  " + imageList.length);
          // Saving the ImageArray to the Database
          Image.insertMany(imageList, function (err, data) {
            if (err != null) {
              console.log("Inserting ImageList documents failed. error: " + err);
              res.status(500).json({
                message: "Inserting ImageList documents failed !!!"
              });
            }
            else {
              //Updaing the filesListLoaded status in User's database
              User.findOneAndUpdate({ email: fetchedUser.email }, { filesListLoaded: 'Y' }, { new: true })
                .then(result => {
                  if (result.filesListLoaded == "Y") {
                    console.log("User FileList Status updated succesfully. result: " + result);
                    res.status(201).json({
                      message: "Images added successfully",
                    });
                  } else {
                    console.log("User FileList Status update failed. result: " + result);
                    res.status(401).json({ message: "Not authorized!" });
                  }
                })
                .catch(error => {
                  console.log("User FileList Status update failed. error: " + error);
                  res.status(500).json({
                    message: "User FileList Status update failed !!!"
                  });
                });
            }
          });
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

  const user_xml_dir = './backend/images/'+editor+'/';
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
  let writeStream = fs.createWriteStream(dir+xmlFileName);
  writeStream.on('error', (err) => {
    console.log(err);
    writeStream.end();
    res.status(500).json({
      message: "Couldn't save Text File. err: " + err
    });
  });
  writeStream.write(formattedXml);

  writeStream.on('finish', () => {
    Image.findOneAndUpdate({fileName: imageFileName }, { completed: 'Y' }, { new: true })
      .then(result => {
        if (result.completed == "Y") {
          res.status(200).json({ message: "XML File saved successfully!", name: imageFileName, completed: "Y" });
        } else {
          console.log("User FileList Status update failed. result: " + result);
          res.status(401).json({ message: "Not authorized!" });
        }
      })
      .catch(error => {
        console.log("User FileList Status update failed. error: " + error);
        res.status(500).json({
          message: "User FileList Status update failed !!!"
        });
      });
  });
  writeStream.end();
});

router.get("", (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const mail = req.query.user;
  var fetchedImages = "";
  let fetchedUser;
  let imageArray = [];
  let imageList = [];
  User.findOne({ email: mail })
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      console.log("user in get" + user.email)
      fetchedUser = user;
      // Get the list of files alloted to the user from database
      Image.find({ editor: fetchedUser._id }, function (err, documents) {
        if (err != null) {
          res.status(200).json({
            message: "Fetching images failed!",
            images: fetchedImages
          });
        }
        fetchedImages = documents;
        fetchedImages.sort((a, b) => a.fileName.localeCompare(b.fileName));
        console.log(fetchedImages.length);
      }).then(fetchedImages => {
        // Get the list of files alloted to the user from storage directory
        const user_wav_dir = './backend/images/' + fetchedUser.email;
        var newFiles = [];
        fs.readdir(user_wav_dir, (err, filesList) => {
          if (err) {
            imageArray = "";
             res.status(201).json({
                  message: "Images fetched successfully!",
                  images: fetchedImages
                });
          }
          else {
            targetFiles = filesList;
            targetFiles.forEach(file => {
              if (path.extname(file).toLowerCase() === ".tif") {
                imageArray.push(file);
              }
            });

            let oldFiles = [];
            let delFiles = [];
            newFiles = imageArray.slice();

            if (fetchedImages.length > 0) {

              if (imageArray.length > 0) {
                fetchedImages.map((fetchedImage) => {
                  absent = 0;
                  imageArray.map((file) => {
                    if (file == fetchedImage.fileName) {
                      oldFiles.push(file);
                    }
                    else {
                      absent++;
                    }
                    if (file != fetchedImage.fileName && absent == imageArray.length) {
                      delFiles.push(fetchedImage.fileName);
                    }
                  })
                });
              }
              else {
                fetchedImages.map((fetchedImage) => {
                  delFiles.push(fetchedImage.name);
                });
              }
              delFiles = delFiles.filter(delFiles => !oldFiles.includes(delFiles));
            }
            else {
              if (imageArray.length > 0) {
                newFiles = imageArray.slice();
              }
            }

            if (imageArray.length > 0) {
              newFiles = newFiles.filter(newFile => !oldFiles.includes(newFile));
            }
            else {
              newFiles = [];
            }
            if (delFiles.length != 0) {
              delFileId = [];
              delFiles.map((delFile) => {
                fetchedImages.map((fetchedImage) => {
                  if (delFile == fetchedImage.name) {
                    delFileId.push(fetchedImage.id);
                  }
                });
              });
              Image.deleteMany({
                _id: {
                  $in: delFileId
                },
                editor: fetchedUser._id
              }).then(result => {
                if (!result) {
                  console.log("delete failed: " + err);
                } else {
                  if (result.n > 0) {
                    console.log("delete success: " + result.n);
                  }
                }
              });
            }

            newFiles.forEach(file => {
              console.log("user email " + fetchedUser.email)
              const path = url + '/images/' + fetchedUser.email + '/' + file;
              const image = {
                _id: fetchedUser._id,
                fileName: file,
                imagePath: path,
                completed: 'N',
                editor: fetchedUser._id
              };
              imageList.push(image);
            });

            // Saving the new WaveList to the Database
            Image.insertMany(imageList).then((data) => {
              if (!data) {
                console.log("Unable to insert data");
              }
              else {
                console.log("inserted data successfully");
              }
            }).then(() => {
              // Wave.find({editor: fetchedUser._id}).sort({"name": 1}).then(documents => 
              Image.find({ editor: fetchedUser._id }, function (err, documents) {
                // err = "";
                if (err != null) {
                  console.log(err);
                  res.status(200).json({
                    message: "Fetching images failed!",
                    images: fetchedImages
                  });
                }
                fetchedImages = documents;
                fetchedImages.sort((a, b) => a.fileName.localeCompare(b.fileName));
                console.log("Images fetched successfully");

                res.status(201).json({
                  message: "Images fetched successfully!",
                  images: fetchedImages
                });
              });
            })
          }
        });
      });
    });
});
module.exports = router;
