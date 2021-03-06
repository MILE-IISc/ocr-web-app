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
const couch = require('../controllers/couch');
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
  accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
  endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
  s3ForcePathStyle: true, // needed with minio?
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

// var upload = multer({
//   fileFilter,
//   storage: multerS3({
//     s3: cos,
//     bucket: (req, file, cb) => {
//       cb(null, req.userData.bucketName);
//     },
//     acl: 'public-read',
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     metadata: function (req, file, cb) {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: function (req, file, cb) {
//       console.log(file.originalname, file);
//       cb(null, file.originalname + "-" + req.query.folderName);
//     }
//   })
// });


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const image_wav_dir = './images/' + req.body.email + '/'
    var fs = require('fs');
    let dir = image_wav_dir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const name = file.originalname;
    cb(null, name);
  }
});

async function deleteImage(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlinkSync(filePath, function (err) {
      if (err && err.code == 'ENOENT') {
        // file doens't exist
        console.log("File doesn't exist, won't remove it.");
        resolve(false);
      } else if (err) {
        // other errors, e.g. maybe we don't have enough permission
        console.log("Error occurred while trying to remove file");
        resolve(false);
      } else {
        console.log(`unknown error`, err);
        resolve(false);
      }
    });
    console.log(filePath, "deleted successfully");
    resolve(true);
  });
}

router.post("",
  authChecker,
  multer({ storage: storage, fileFilter: fileFilter }).single("image"),
  async function (req, res, next) {
    const mail = req.body.email;
    const bookDbName = req.query.bookDbName;
    const userDbName = "mile_user_db_" + req.userData.userId;
    const bookName = req.query.bookDbName.replace('mile_book_db_', '');;
    console.log("inside post email ", mail, "bookDbName", bookDbName, "userId", req.userData.userId);
    bucketName = req.userData.bucketName;
    console.log("bucketName inside post images ", bucketName);
    console.log("multer upload response", res.statusCode);
    // console.log("multer upload response", req);
    if (req.file) {
      console.log("file stored succesfully");
      let originalImage = req.file.originalname;
      let tiffToJpgImage = req.file.originalname;
      let tiffToJpgImagePath = './images/' + mail + '/' + req.file.originalname;
      let originalImagePath = './images/' + mail + '/' + req.file.originalname;
      if (res.statusCode === 200) {
        console.log("req.file.mimetype", req.file.mimetype);
        // console.log("file width", file.getWidth());
        if (req.file.mimetype == "image/tiff") {
          jpegFile = await Jimp.read(originalImagePath).then(async (file) => {
            return file;
          })
          tiffToJpgImage = originalImage.slice(0, -3) + 'jpg';
          tiffToJpgImagePath = './images/' + mail + "/" + tiffToJpgImage;
          await jpegFile
            .quality(75)
            .writeAsync(tiffToJpgImagePath).then(async () => {
              console.log("file is ready for", mail, tiffToJpgImagePath);
              await multiPartUpload(bucketName, originalImage, originalImagePath).then(async (status) => {
                console.log("multuipart upload completed for", originalImagePath, "with status", status);
                await deleteImage(originalImagePath).then((status) => {
                  console.log("deleted Image", originalImagePath, "with status", status, "and sending back successful response");
                });
              });
            })
            .catch((err) => {
              console.log("error while reading, converting & uploading image:", err);
              res.status(200).json({
                message: req.file.originalname + " Image upload failed" + invalid,
                uploaded: "N"
              });
              invalid = "";
              resolve(false);
            });
        }
        // console.log("tiffStatus after if tiff condition",tiffStatus);
        console.log("tiffToJpgImagePath after if tiff condition", tiffToJpgImagePath);
        Jimp.read(tiffToJpgImagePath).then(async (jpegFile) => {
          await jpegFile
          .quality(25)
          .resize(128, 128)
          .getBase64Async(Jimp.MIME_JPEG).then(async (thumbnailBase64) => {
            console.log("thumbnailBase64 created");
            console.log("calling multiPartUpload for", tiffToJpgImagePath);
            await multiPartUpload(bucketName, tiffToJpgImage, tiffToJpgImagePath).then(async (status) => {
              console.log("multuipart upload completed for", tiffToJpgImagePath, "with status", status);
              await couch.findById(userDbName, bookName).then(async (response) => {
                if (response.statusCode == 404) {
                  console.log("Book Document not available. Send error response.");
                  res.status(200).json({
                    message: req.file.originalname + " Image upload failed " + invalid,
                    uploaded: "N"
                  });
                  invalid = "";
                } else {
                  if (response.documents.docs.length == 1) {
                    bookDocument = response.documents.docs[0];
                    if (bookDocument.bookThumbnailImage == "") {
                      bookDocument.bookThumbnailImage = thumbnailBase64;
                    }
                    await couch.insertDocument(userDbName, bookDocument).then((result) => {
                      console.log("insert page Document result", result);
                      if (result.ok == true) {
                        console.log("book document has been updated in user database", userDbName);
                      } else {
                        console.log("Inserting page document to bookDb failed");
                      }
                    });
                  }
                }
                await couch.findPage(bookDbName, originalImage).then(async (response) => {
                  if (response.statusCode == 404) {
                    console.log("document not found. So, setting default pageDocument");
                    pageDocument = {
                      pageName: originalImage,
                      pageThumbnail: thumbnailBase64,
                      rawImageId: bucketName + "/" + originalImage,
                      imageId: bucketName + "/" + tiffToJpgImage
                    };
                  } else {
                    console.log("Got Output from find document for pageName", originalImage, "in", bookDbName, "no. of documents", response.documents.docs.length);
                    if (response.documents.docs.length == 1) {
                      pageDocument = response.documents.docs[0];
                      pageDocument.pageThumbnail = thumbnailBase64;
                      pageDocument.rawImageId = bucketName + "/" + originalImage;
                      pageDocument.imageId = bucketName + "/" + tiffToJpgImage;
                      // console.log("pageDocument from bookDb after conversion",pageDocument);
                    }
                  }
                  await couch.insertDocument(bookDbName, pageDocument).then((result) => {
                    console.log("insert page Document result", result);
                    if (result.ok == true) {
                      console.log("page document has been inserted into database", bookDbName);
                    } else {
                      console.log("Inserting page document to bookDb failed");
                    }
                  });
                });
              });
              await deleteImage(tiffToJpgImagePath).then((status) => {
                console.log("deleted Image", tiffToJpgImagePath, "with status", status, "and sending back successful response");
                res.status(201).json({
                  message: req.file.originalname + " Image uploaded successfully" + invalid,
                  uploaded: "Y"
                });
                invalid = "";
              });
            });
          });
        });
      }
      else {
        console.log("error in filelist  " + err);
        res.status(200).json({
          message: req.file.originalname + " Image upload failed " + invalid,
          uploaded: "N"
        });
        invalid = "";
      }
    } else {
      console.log("Invalid MIME Type");
      res.status(200).json({
        message: " Image upload failed " + invalid,
        uploaded: "N"
      });
      invalid = "";
    }
  });

router.get("", authChecker, (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const mail = req.userData.email;
  const userId = req.userData.userId;
  const folderName = req.query.folderName;
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
      if (file.includes(folderName)) {
        var splitFileName = file.split("-");
        if (path.extname(splitFileName[0]).toLowerCase() == ".tif") {
          tiffImages.push(splitFileName[0].trim());
          fetchedImages.push(splitFileName[0].trim());
        }
        else if (path.extname(splitFileName[0]).toLowerCase() == ".jpg") {
          jpegImages.push(splitFileName[0].trim());
        }
        else if (path.extname(splitFileName[0]).toLowerCase() == ".png" || path.extname(splitFileName[0]).toLowerCase() == ".bmp") {
          fetchedImages.push(splitFileName[0].trim());
        } else if (path.extname(splitFileName[0]).toLowerCase() == ".xml") {
          xmlArrayList.push(splitFileName[0]);
        }
      }
    });

    if (jpegImages.length > 0) {
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

function getItemHeader(bucketName, itemName) {
  // console.log(`Retrieving item header from bucket: ${bucketName}, key: ${itemName}`);
  return cos.headObject({
    Bucket: bucketName,
    Key: itemName
  }).promise()
  .then((data) => {
    if (data != null) {
      console.log(`Retrieved HEAD for item: ${itemName} from bucket: ${bucketName}`);
      console.log("header data inside getItemheader", JSON.stringify(data, null, 4));
      return data;
    }
  })
  .catch((e) => {
    console.error(`ERROR: ${e.code} - ${e.message}\n`);
    return "";
  });
}

function getItem(bucketName, itemName) {
  console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
  return cos.getObject({
    Bucket: bucketName,
    Key: itemName
  }).promise()
    .then((data) => {
      if (data != null) {
        console.log("itemName", itemName, "data.ContentType", data.ContentType);
        let prefix = "data:image/jpeg;base64,";
        let base64 = Buffer.from(data.Body).toString('base64');
        let jpgData = prefix + base64;
        return jpgData;
      }
    })
    .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
      return "ERROR: " + e.code + " - " + e.message + "\n";
    });
}

router.get("/:fileName", authChecker, (req, res, next) => {
  let type = req.query.type;
  let jpegFile = req.params.fileName;
  console.log("req.params.fileName", jpegFile);
  if (path.extname(jpegFile).toLowerCase() == ".tif") {
    jpegFile = jpegFile.slice(0, -3) + 'jpg';
  }
  bucketName = req.userData.bucketName;
  console.log("bucketName inside get specific Image ", bucketName);
  if (type == "GET-HEADER") {
    getItemHeader(bucketName, jpegFile).then((data) => {
      if (data == "The specified key does not exists in bucket") {
        console.log("error while retrieving image header info:", data);
        res.status(400).json({
          message: data,
          json: ""
        });
      }
      else {
        res.status(201).json({
          message: "image header info fetched successfully",
          json: data
        });
      }
    });
  } else {
    getItem(bucketName, jpegFile).then((data) => {
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
  }
});

router.delete("/:fileName", authChecker, (req, res, next) => {
  const filesToBeDeleted = [];
  const documentId = req.query.documentId;
  const bookDbName = req.query.bookDbName;
  console.log("documentId in delete", documentId);
  filesToBeDeleted.push(req.params.fileName);
  fileName = req.params.fileName;
  if (path.extname(fileName).toLowerCase() == ".tif") {
    tifJpegFileName = fileName.slice(0, -3) + 'jpg';
    filesToBeDeleted.push(tifJpegFileName);
  }

  bucketName = req.userData.bucketName;
  count = 0;
  for (i = 0; i < filesToBeDeleted.length; i++) {
    deleteItem(bucketName, filesToBeDeleted[i]).then((response) => {
      count = count + 1;
      if (count == filesToBeDeleted.length) {
        res.status(200).json({
          message: filesToBeDeleted[0] + " deleted successfully",
          completed: 'Y'
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
    .then(() => {
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
  return new Promise(async (resolve, reject) => {
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
                resolve(true);
              })
              .catch((e) => {
                cancelMultiPartUpload(bucketName, itemName, uploadID);
                console.error(`ERROR: ${e.code} - ${e.message}\n`);
                resolve(false);
              });
          });
        });
      })
      .catch((e) => {
        console.error(`ERROR: ${e.code} - ${e.message}\n`);
      });
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
