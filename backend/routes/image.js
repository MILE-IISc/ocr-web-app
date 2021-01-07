const express = require("express");
const fs = require("fs");
var path = require('path');
var async = require('async');
var format = require('xml-formatter');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
const router = express.Router();
const multer = require('multer');
const { promise } = require("protractor");
var util = require('util');
const Tiff = require('tiff.js');

const checkAuth = require("../middleware/check-auth");
// const extractFile = require("../middleware/file"); extractFile,
const WaveController = require("../controllers/waves");
const Image = require("../models/image");
const User = require("../models/user");

const cloudStorage = require('ibm-cos-sdk');
const multerS3 = require('multer-s3');
const bucket = "my-bucket-sasi-dev-test-ahsdbasjhbdjash";
var config = {
  endpoint: process.env.object_storage_endpoint,
  apiKeyId: process.env.object_storage_apiKeyId,
  ibmAuthEndpoint: process.env.object_storage_ibmAuthEndpoint,
  serviceInstanceId: process.env.object_storage_serviceInstanceId,
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


doCreateObject().then(() => {
  console.log('Created object');
  // doGetObject();
  getBuckets();
//   doDeleteObject().then(() => {
//     console.log('deleted object');
//   }).catch((err) => {
//       console.error('An error occurred while deleting object:');
//       console.error(util.inspect(err));
//   });
// }).catch((err) => {
//     console.error('An error occurred while creating object:');
//     console.error(util.inspect(err));
});

function doCreateObject() {
  console.log('Creating object');
  return cos.putObject({
      Bucket: bucket,
      Key: 'foo',
      Body: 'Hi from Sasi'
  }).promise();
}

function doGetObject() {
  console.log('Getting object');
  return cos.getObject({
    Bucket: bucket,
    Key: 'foo'
  }).createReadStream().pipe(fs.createWriteStream('./MyObject'));
 }

 function doDeleteObject() {
  console.log('Deleting object');
  return cos.deleteObject({
      Bucket: bucket,
      Key: 'foo'
  }).promise();
}


function getBuckets() {
  console.log('Retrieving list of buckets');
  return cos.listBuckets()
  .promise()
  .then((data) => {
      if (data.Buckets != null) {
          for (var i = 0; i < data.Buckets.length; i++) {
              console.log(`Bucket Name: ${data.Buckets[i].Name}`);
              var curBucket = data.Buckets[i].Name;
              getBucketContents(curBucket);
          }
      }
  })
  .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
  });
}


function getBucketContents(bucketName) {
  console.log(`Retrieving bucket contents from: ${bucketName}`);
  return cos.listObjects(
      {Bucket: bucketName},
  ).promise()
  .then((data) => {
      if (data != null && data.Contents != null) {
          for (var i = 0; i < data.Contents.length; i++) {
              var itemKey = data.Contents[i].Key;
              var itemSize = data.Contents[i].Size;
              console.log(`Item: ${itemKey} (${itemSize} bytes).`);
              // if(itemKey == "balaaka_0001.tif"){
              //   console.log("reached getItem: "+itemKey);
              //   continue;
              // }
              getItem(bucketName, itemKey);
          }
      }
  })
  .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
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
          if(itemName == "test.jpg") {
            let prefix = "data:image/jpg;base64,";
            let base64 = Buffer.from(data.Body).toString('base64');
            let jpgData = prefix + base64;
            // console.log("jpgData: "+jpgData);
          }
          else if(itemName == "balaaka_0001.tif"){
            console.log('reached balaaka_0001.tif in getItem\n');
            let prefix = "data:tif;base64,";
            // let tiffData = prefix + base64;
            // console.log("tiffData: "+tiffData);
            const tiffArrayBuff = Buffer.from(data.Body).buffer;
            console.log("tiffData: "+tiffArrayBuff);
            var tiffImage = new Tiff({ buffer: tiffArrayBuff });
            console.log("tiffImage: "+tiffImage);
          }
          else {
            console.log('File Contents:\n' + Buffer.from(data.Body).toString());
          }
      }
  })
  .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
  });
}

function multiPartUpload(bucketName, itemName, filePath) {
    var uploadID = null;

    if (!fs.existsSync(filePath)) {
        log.error(new Error(`The file \'${filePath}\' does not exist or is not accessible.`));
        return;
    }

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
                    next(e, {ETag: data.ETag, PartNumber: partNum});
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
                .then(console.log(`Upload of all ${partCount} parts of ${itemName} successful.`))
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
    .catch((e)=>{
        console.error(`ERROR: ${e.code} - ${e.message}\n`);
    });
}


var upload = multer({
  storage: multerS3({
      s3: cos,
      bucket: bucket,
      acl: 'public-read',
      metadata: function (req, file, cb) {
          cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
          console.log(file.originalname , file);
          cb(null, file.originalname);
      }
  })
});

router.post("", checkAuth,
  upload.array("image", 4000),
  (req, res, next) => {

  if (res.statusCode === 200 && req.files.length > 0) {
    console.log("file list length " + req.files.length);
    res.status(201).json({
      message: "Images added successfully",
    });
  }
  else {
    console.log("error in filelist  " + err);
    res.status(500).json({
      message: "error in adding images",
    });
  }
});

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


// router.post("", checkAuth,
//   multer({ storage: storage }).array("image", 4000),
//   (req, res, next) => {
//     let imageList = [];
//     let fetchedUser;
//     User.findOne({ email: req.body.email })
//       .then(user => {
//         if (!user) {
//           return res.status(401).json({
//             message: "Auth failed"
//           });
//         }
//         fetchedUser = user;
//       }).then(() => {
//         const url = req.protocol + "://" + req.get("host");
//         const user_wav_dir = './backend/images/' + req.body.email;
//         // const filePath = './backend/images/' + req.body.email +"/balaaka_0001.tif";
//         // console.log("file Path " + filePath);
//         // console.log("calling multiPartUpload");
//         // multiPartUpload(bucket, "balaaka_0001.tif", filePath);
//         // console.log("completed multiPartUpload");
//         fs.readdir(user_wav_dir, (err, filesList) => {
//           if (err) {
//             console.log("error in filelist  " + err);
//             imageList = "";
//             res.status(500).json({
//               message: "error in adding images",
//             });
//           } else {
//             targetFiles = filesList;
//             console.log("file list length " + filesList.length);
//             res.status(201).json({
//               message: "Images added successfully",
//             });
//           }
//         });
//       });
//   });

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

router.get("", checkAuth,(req, res, next) => {
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
      // console.log("user in get" + user.email)
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
              // console.log("user email " + fetchedUser.email)
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

router.get("/:fileName", checkAuth, (req, res, next) =>{
  editor = req.userData.email;
  console.log("user in run ocr get "+editor)
  const XmlfileName = req.params.fileName;
  console.log("XmlfileName in get call "+XmlfileName);
  const user_wav_dir = './backend/images/'+editor+"/" + XmlfileName;
  fs.readFile(user_wav_dir, "utf-8", function (error, text) {
    if (error) {
        throw error;
    }else {
        parser.parseString(text, function (err, result) {
            // var books = result['bookstore']['book'];
            var jsonString = JSON.stringify(result)
            console.log("result as JSON "+jsonString);
            res.status(201).json({
              message: "xml read successfully",
              json: result
            });
        });
    }
});

});
module.exports = router;
