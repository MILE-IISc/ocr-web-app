const express = require("express");
const fs = require("fs");
var path = require('path');
var async = require('async');
var format = require('xml-formatter');
const router = express.Router();
const multer = require('multer');
const { promise } = require("protractor");
var util = require('util');
const Jimp = require('jimp');

const authChecker = require("../middleware/auth-checker");
const WaveController = require("../controllers/waves");
const Image = require("../models/image");
const User = require("../models/user");
const bucketFilesList = [];
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/tiff": "tif",
  "image/bmp": "bmp"
};

var invalid = "";
const cloudStorage = require('ibm-cos-sdk');
const multerS3 = require('multer-s3');
bucket = "";
var config = {
  endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
  apiKeyId: process.env.OBJECT_STORAGE_API_KEY_ID,
  ibmAuthEndpoint: process.env.OBJECT_STORAGE_IBM_AUTH_ENDPOINT,
  serviceInstanceId: process.env.OBJECT_STORAGE_SERVICE_INSTANCE_ID,
};

var cos = new cloudStorage.S3(config);


// doCreateBucket().then(() => {
//   console.log('Finished!');
// })
// .catch((err) => {
//   console.error('An error occurred:');
//   console.error(util.inspect(err));
// });

function doCreateBucket() {
  console.log('Creating bucket');
  return cos.createBucket({
    Bucket: bucket,
    CreateBucketConfiguration: {
      LocationConstraint: 'us-standard'
    },
  }).promise();
}

function getBucketContents(bucketName) {
  console.log(`Retrieving bucket contents from: ${bucketName}`);
  return cos.listObjects(
    { Bucket: bucketName },
  ).promise()
    .then((data) => {
      if (data != null && data.Contents != null) {
        bucketFilesList.splice(0, bucketFilesList.length);
        for (var i = 0; i < data.Contents.length; i++) {
          var itemKey = data.Contents[i].Key;
          var itemSize = data.Contents[i].Size;
          console.log(`Item: ${itemKey} (${itemSize} bytes).`);
          bucketFilesList.push(itemKey);
        }
      }
    })
    .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
      fetchedImages = "";
      res.status(201).json({
        message: "No image files",
        images: fetchedImages
      });
    });
}


function getItem(bucketName, itemName, mail, requestType) {
  console.log("mail inside getItem first", mail)
  console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
  return cos.getObject({
    Bucket: bucketName,
    Key: itemName
  }).promise()
    .then((data) => {
      if (data != null) {
        console.log("path.extname(itemName).toLowerCase() ", path.extname(itemName).toLowerCase(), " requestType ", requestType);
        if (path.extname(itemName).toLowerCase() == ".tif" && requestType == "POST") {
          console.log('reached getting tif data in getItem\n', itemName);
          const tiffArrayBuff = Buffer.from(data.Body).buffer;
          console.log("tiff ", data.Metadata);
          console.log("tiff ", data.ContentType);
          console.log("tiffArrayBuff: " + tiffArrayBuff);

          console.log("mail===========> ", mail);
          Jimp.read(Buffer.from(tiffArrayBuff, 'base64')).then((file) => {
            // console.log("Jimp file ", file);
            // console.log("file width", file.getWidth());
            file
              .quality(75)
              .writeAsync('./images/' + mail + "/" + itemName.slice(0, -3) + 'jpg').then(() => {
                console.log("file is ready for", mail, " fileName ", itemName.slice(0, -3).toLowerCase() + 'jpg');
                // console.log("image content retrieved and converted");
                let tiffToJpg = itemName.slice(0, -3) + 'jpg';
                const filePath = './images/' + mail + "/" + tiffToJpg;
                console.log("file Path " + filePath);
                console.log("calling multiPartUpload");
                multiPartUpload(bucketName, tiffToJpg, filePath);
              });
          });
        }
        else if (path.extname(itemName).toLowerCase() == ".png" || path.extname(itemName).toLowerCase() == ".jpg" || path.extname(itemName).toLowerCase() == ".bmp") {
          console.log("itemName", itemName, "data.ContentType", data.ContentType);
          let prefix = "data:image/jpeg;base64,";
          let base64 = Buffer.from(data.Body).toString('base64');
          let jpgData = prefix + base64;
          return jpgData;
        }
      }
    })
    .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
      return "ERROR: " + e.code + " - " + e.message + "\n";
    });
}

const fileFilter = (req, file, cb) => {
  const isValid = MIME_TYPE_MAP[file.mimetype];
  if (isValid) {
    invalid = ""
    cb(null, true);
  } else {
    invalid = "And invalid file types were skipped. "
    cb(null, false);
  }
}

var upload = multer({
  fileFilter,
  storage: multerS3({
    s3: cos,
    bucket: (req, file, cb) => {
      cb(null, req.userData.bucketName);
    },
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      console.log(file.originalname, file);
      cb(null, file.originalname);
    }
  })
});

router.post("",
  authChecker,
  upload.single("image"),
  (req, res, next) => {
    console.log("inside post email ", req.body.email);
    bucketName = req.userData.bucketName;
    console.log("bucketName inside post images ", bucketName);
    console.log("req.file details",req.file.originalname);
    // let postJpegImages = [];
    // let postTiffImages = [];
    // let postFetchedImages = [];
    if (res.statusCode === 200 && req.file) {
      console.log("multer upload response");
      if(req.file.mimetype == "image/tiff") {
        getItem(bucketName, req.file.originalname, req.body.email, "POST").then((itemData) => {
          res.status(201).json({
            message: req.file.originalname + " Image uploaded successfully" + invalid,
            uploaded: "Y"
          });
          if (itemData == "The specified key does not exists in bucket") {
            console.log("error while retrieving and converting image:", itemData);
            res.status(200).json({
              message: req.file.originalname + " Image upload failed" + invalid,
              uploaded: "N"
            });
          }
        });
      }
      // cos.listObjects(
      //   { Bucket: bucketName },
      // ).promise()
      //   .then((data) => {
      //     console.log("data.Contents.length in post", data.Contents.length);
      //     for (let i = 0; i < data.Contents.length; i++) {
      //       if (path.extname(data.Contents[i].Key).toLowerCase() == ".tif") {
      //         postTiffImages.push(data.Contents[i].Key.trim());
      //         // console.log("TiffImage in post",data.Contents[i].Key.trim());
      //       }
      //       else if (path.extname(data.Contents[i].Key).toLowerCase() == ".jpg") {
      //         postJpegImages.push(data.Contents[i].Key.trim());
      //         // console.log("JpegImage in post",data.Contents[i].Key.trim());
      //       }
      //     }
      //     console.log("post for loop finished with postTiffImages.length",postTiffImages.length);
      //     console.log("post for loop finished with postJpegImages.length",postJpegImages.length);
      //     console.log("post for loop finished with postFetchedImages.length",postFetchedImages.length);

      //     if(postTiffImages.length > 0) {
      //       postTiffImages.map(postTiffImage => {
      //         mismatchCount = 0;
      //         if(postJpegImages.length == 0) {
      //           postFetchedImages.push(postTiffImage);
      //         }
      //         else {
      //           postJpegImages.map(postJpegImage => {
      //             if(postJpegImage.slice(0, -3).toLowerCase() != postTiffImage.slice(0, -3).toLowerCase()) {
      //               mismatchCount = mismatchCount + 1;
      //             }

      //             if(postJpegImage.slice(0, -3).toLowerCase() != postTiffImage.slice(0, -3).toLowerCase() && mismatchCount == postJpegImages.length) {
      //               postFetchedImages.push(postTiffImage);
      //               console.log("Tiff without Jpeg", postTiffImage);
      //             }
      //           });
      //         }
      //       });
      //     }

      //     if(postFetchedImages.length > 0) {
      //       for (let i = 0; i < postFetchedImages.length; i++) {
      //         console.log("Tiff to be converted and uploaded back " + postFetchedImages[i]);
      //         if (path.extname(postFetchedImages[i]).toLowerCase() == ".tif") {
      //           console.log("tiff files", postFetchedImages[i]);
      //           getItem(bucketName, postFetchedImages[i], req.body.email, "POST").then((itemData) => {
      //             console.log("invalid " + invalid);
      //             res.status(201).json({
      //               message: "Images uploaded successfully!!! " + invalid,
      //             });
      //             if (data == "The specified key does not exists in bucket") {
      //               console.log("error while retrieving and converting image:", itemData);
      //             }
      //           });
      //         }
      //       }
      //     } else {
      //       res.status(200).json({
      //         message: "Images uploaded successfully!!! " + invalid,
      //       });
      //     }
      //   })
      //   .catch((e) => {
      //     console.error(`ERROR: ${e.code} - ${e.message}\n`);
      //   });
    }
    else {
      console.log("error in filelist  " + err);
      res.status(200).json({
        message: req.file.originalname + " Image upload failed " + invalid,
        uploaded: "N"
      });
    }
  });

router.get("", authChecker, (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const mail = req.query.user;
  const userId = req.userData.userId;
  console.log("inside get request start mail", mail);
  var fetchedImages = [];
  var tiffImages = [];
  var jpegImages = [];
  let fetchedUser;
  let imageList = [];
  let xmlArrayList = [];
  let completed;
  bucketName = req.userData.bucketName;
  console.log("bucket inside get request", bucketName);
  var newFiles = [];
  getBucketContents(bucketName).then(() => {
    console.log("totalFilesList.length:", bucketFilesList.length);
    targetFiles = bucketFilesList;
    console.log("targetFiles.length:", targetFiles.length);
    targetFiles.forEach(file => {
      if (path.extname(file).toLowerCase() == ".tif") {
        tiffImages.push(file.trim());
        fetchedImages.push(file.trim());
      }
      else if (path.extname(file).toLowerCase() == ".jpg") {
        jpegImages.push(file.trim());
      }
      else if (path.extname(file).toLowerCase() == ".png" || path.extname(file).toLowerCase() == ".bmp") {
        fetchedImages.push(file.trim());
      } else if (path.extname(file).toLowerCase() == ".xml") {
        xmlArrayList.push(file);
      }
    });

    if(jpegImages.length > 0) {
      jpegImages.map(jpegImage => {
        mismatchCount = 0;
        if (tiffImages.length == 0) {
          fetchedImages.push(jpegImage);
          // console.log("jpeg Image only", jpegImage);
        }
        else {
          tiffImages.map(tiffImage => {
            if (tiffImage.slice(0, -3).toLowerCase() != jpegImage.slice(0, -3).toLowerCase()) {
              mismatchCount = mismatchCount + 1;
            }
            if (tiffImage.slice(0, -3).toLowerCase() != jpegImage.slice(0, -3).toLowerCase() && mismatchCount == tiffImages.length) {
              fetchedImages.push(jpegImage);
              // console.log("jpeg Image only", jpegImage);
            }
          });
        }
      });
    }

    if (fetchedImages.length > 0) {
      fetchedImages.forEach(files => {
        console.log("fetchedImages name", files);
        const xmlFile = files.slice(0, -3) + 'xml';
        if (xmlArrayList.includes(xmlFile)) {
          completed = 'Y';
        } else {
          completed = 'N';
        }
        const image = {
          _id: userId,
          fileName: files,
          completed: completed,
          editor: mail,
          dataUrl: ""
        };
        imageList.push(image);
        imageList.sort((a, b) => a.fileName.localeCompare(b.fileName));
      });
      res.status(201).json({
        message: "Images fetched successfully!",
        images: imageList
      });
      console.log("imageList length " + imageList.length);
      imageList.forEach(files => {
        console.log("files.fileName " + files.fileName + " files.completed", files.completed);
      });
    } else {
      imageList = "";
      res.status(201).json({
        message: "No image files",
        images: imageList
      });
    }
  });
});

router.get("/:fileName", authChecker, (req, res, next) => {
  const mail = req.query.user;
  let fetchedUser;
  let jpegFile = req.params.fileName;
  console.log("req.params.fileName", jpegFile);
  if (path.extname(jpegFile).toLowerCase() == ".tif") {
    jpegFile = jpegFile.slice(0, -3) + 'jpg';
  }
  bucketName = req.userData.bucketName;
  console.log("bucketName inside get specific Image ", bucketName);
  getItem(bucketName, jpegFile, req.query.user, "GET").then((data) => {
    if (data == "The specified key does not exists in bucket") {
      console.log("error while retrieving image:", data);
      res.status(400).json({
        message: data,
        json: ""
      });
    }
    else {
      res.status(201).json({
        message: "image fetched successfully",
        json: data
      });
    }
  });
});

router.delete("/:fileName", authChecker, (req, res, next) => {
  const filesToBeDeleted = [];
  filesToBeDeleted.push(req.params.fileName);
  filesToBeDeleted.push(req.params.fileName.slice(0,-3) + 'xml');
  if (path.extname(req.params.fileName).toLowerCase() == ".tif") {
    filesToBeDeleted.push(req.params.fileName.slice(0,-3) + 'jpg');
  }
  
  bucketName = req.userData.bucketName;
  count = 0;
  for (i = 0; i < filesToBeDeleted.length; i++) {
    deleteItem(bucketName,filesToBeDeleted[i]).then((response) => {
      count = count + 1;
      if (count == filesToBeDeleted.length) {
        res.status(200).json({
          message: filesToBeDeleted[0] + " deleted successfully"
        });
      }
    });
  }
});

function deleteItem(bucketName, itemName) {
  return cos.deleteObject({
      Bucket: bucketName,
      Key: itemName
  }).promise()
  .then(() =>{
      return `Item: ${itemName} deleted!`;
  }).catch((e) => {
      return `ERROR: ${e.code} - ${e.message}\n while deleting Item: ${itemName}`;
  });
}

function multiPartUpload(bucketName, itemName, filePath) {
  var uploadID = null;

  if (!fs.existsSync(filePath)) {
    // log.error(new Error(`The file \'${filePath}\' does not exist or is not accessible.`));
    console.log("The file", filePath, "does not exist or is not accessible.");
    return;
  }
  console.log("filePath inside multiPart Upload", filePath);
  console.log(`Starting multi-part upload for ${itemName} to bucket: ${bucketName}`);
  return cos.createMultipartUpload({
    Bucket: bucketName,
    Key: itemName
  }).promise()
    .then((data) => {
      uploadID = data.UploadId;

      //begin the file upload
      fs.readFile(filePath, (e, fileData) => {
        //min 5MB part
        var partSize = 1024 * 1024 * 5;
        var partCount = Math.ceil(fileData.length / partSize);

        async.timesSeries(partCount, (partNum, next) => {
          var start = partNum * partSize;
          var end = Math.min(start + partSize, fileData.length);

          partNum++;

          console.log(`Uploading to ${itemName} (part ${partNum} of ${partCount})`);

          cos.uploadPart({
            Body: fileData.slice(start, end),
            Bucket: bucketName,
            Key: itemName,
            PartNumber: partNum,
            UploadId: uploadID
          }).promise()
            .then((data) => {
              next(e, { ETag: data.ETag, PartNumber: partNum });
            })
            .catch((e) => {
              cancelMultiPartUpload(bucketName, itemName, uploadID);
              console.error(`ERROR: ${e.code} - ${e.message}\n`);
            });
        }, (e, dataPacks) => {
          cos.completeMultipartUpload({
            Bucket: bucketName,
            Key: itemName,
            MultipartUpload: {
              Parts: dataPacks
            },
            UploadId: uploadID
          }).promise()
            .then(() => {
              console.log(`Upload of all ${partCount} parts of ${itemName} successful.`);
              console.log("filePath in multiPart successful upload", filePath);
              fs.unlinkSync(filePath, function (err) {
                if (err && err.code == 'ENOENT') {
                  // file doens't exist
                  console.log("File doesn't exist, won't remove it.");
                } else if (err) {
                  // other errors, e.g. maybe we don't have enough permission
                  console.log("Error occurred while trying to remove file");
                } else {
                  console.log(`file removed`);
                }
              });
            })
            .catch((e) => {
              cancelMultiPartUpload(bucketName, itemName, uploadID);
              console.error(`ERROR: ${e.code} - ${e.message}\n`);
            });
        });
      });
    })
    .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
    });
}

function cancelMultiPartUpload(bucketName, itemName, uploadID) {
  return cos.abortMultipartUpload({
    Bucket: bucketName,
    Key: itemName,
    UploadId: uploadID
  }).promise()
    .then(() => {
      console.log(`Multi-part upload aborted for ${itemName}`);
    })
    .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
    });
}

module.exports = router;
