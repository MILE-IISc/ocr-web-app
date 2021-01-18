const express = require("express");
const fs = require("fs");
var path = require('path');
var async = require('async');
var format = require('xml-formatter');
const router = express.Router();
const multer = require('multer');
const { promise } = require("protractor");
var util = require('util');
const Tiff = require('tiff.js');
const Jimp = require('jimp');

const checkAuth = require("../middleware/check-auth");
// const extractFile = require("../middleware/file"); extractFile,
const WaveController = require("../controllers/waves");
const Image = require("../models/image");
const User = require("../models/user");
const bucketFilesList = [];
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/tiff": "tif",
  "image/bmp" : "bmp"
};

var invalid ="";
const cloudStorage = require('ibm-cos-sdk');
const multerS3 = require('multer-s3');
const bucket = "my-bucket-maithri-dev-test-ahsdbasjhbdjash";
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

function getBucketContents(bucketName) {
  console.log(`Retrieving bucket contents from: ${bucketName}`);
  return cos.listObjects(
      {Bucket: bucketName},
  ).promise()
  .then((data) => {
      if (data != null && data.Contents != null) {
        bucketFilesList.splice(0, bucketFilesList.length);
          for (var i = 0; i < data.Contents.length; i++) {
              var itemKey = data.Contents[i].Key;
              var itemSize = data.Contents[i].Size;
              console.log(`Item: ${itemKey} (${itemSize} bytes).`);
              bucketFilesList.push(itemKey);
              // if(itemKey == "balaaka_0001.tif"){
              //   console.log("reached getItem: "+itemKey);
              //   continue;
              // }
              // getItem(bucketName, itemKey);
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
  console.log("mail inside getItem first",mail)
  console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
  return cos.getObject({
      Bucket: bucketName,
      Key: itemName
  }).promise()
  .then((data) => {
      if (data != null) {
          if(path.extname(itemName).toLowerCase() == ".tif" && requestType == "post") {
            console.log('reached getting tif data in getItem\n',itemName);
            let prefix = "data:tif;base64,";
            // let tiffData = prefix + base64;
            // console.log("tiffData: "+tiffData);
            const tiffArrayBuff = Buffer.from(data.Body).buffer;
            console.log("tiff ",data.Metadata);
            console.log("tiff ",data.ContentType);
            console.log("tiffArrayBuff: "+tiffArrayBuff);

            console.log("mail===========> ",mail);
            Jimp.read(Buffer.from(tiffArrayBuff, 'base64')).then((file) => {
              console.log("Jimp file ",file);
              console.log("file width",file.getWidth());
              file
              .quality(75)
              .write('./backend/images/'+mail+"/"+itemName.slice(0, -3).toLowerCase() + 'jpg');
            });
          }
          else if(path.extname(itemName).toLowerCase() == ".png" || path.extname(itemName).toLowerCase() == ".jpg" || path.extname(itemName).toLowerCase() == ".bmp"){
            console.log("itemName",itemName,"data.ContentType",data.ContentType);
            let prefix = "data:image/jpeg;base64,";
            let base64 = Buffer.from(data.Body).toString('base64');
            let jpgData = prefix + base64;
            // console.log("jpgData: "+jpgData);
            return jpgData;
          }
      }
  })
  .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
      return "ERROR: "+e.code+" - "+e.message+"\n";
  });
}

const fileFilter = (req,file,cb)=>{
  const isValid = MIME_TYPE_MAP[file.mimetype];
  if(isValid){
    cb(null,true);
  }else{
    invalid = "And invalid file types were skipped. "
    cb(null,false);
  }
}

var upload = multer({
  fileFilter,
  storage: multerS3({
    s3: cos,
    bucket: bucket,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      console.log("file.originalname"+file.originalName+"file.mimetype"+file.mimetype);
      console.log(file.originalname, file);
      cb(null, file.originalname);
    }
  })
});

router.post("", checkAuth,
  upload.array("image", 4000),
  (req, res, next) => {
    console.log("inside post email ",req.body.email)
  if (res.statusCode === 200 && req.files.length > 0) {
    console.log("file list length for upload", req.files.length);
    console.log("invoked multer and sending response", Date());
    cos.listObjects(
      {Bucket: bucket},
    ).promise()
    .then((data) => {
      console.log("data.Contents.length in post",data.Contents.length);
      for(let i = 0; i < data.Contents.length; i++) {
        console.log("data for file"+data.Contents[i].Key+""+data.Contents[i].ETag);
        console.log("data for file"+data.Contents[i].Key+""+data.Contents[i].Size);
        if(path.extname(data.Contents[i].Key).toLowerCase() == ".tif") {
          console.log("tiff files",data.Contents[i].Key);
          getItem(bucket, data.Contents[i].Key, req.body.email, "postRequest").then((itemData) => {
            if(data == "The specified key does not exists in bucket") {
              console.log("error while retrieving and converting image:",itemData);
            }
            else {
              console.log("image content retrieved and converted");
              let tiffToJpg = data.Contents[i].Key.slice(0, -3).toLowerCase() + 'jpg';
              const filePath = './backend/images/' + req.body.email+"/" +tiffToJpg;
              console.log("file Path " + filePath);
              console.log("calling multiPartUpload");
              multiPartUpload(bucket, tiffToJpg, filePath);
            }
          });
        }
      }
    })
    .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
    });

    console.log("invalid "+invalid);
    res.status(201).json({
      message: "Images uploaded successfully!!! "+invalid,
    });
  }
  else {
    console.log("error in filelist  " + err);
    res.status(500).json({
      message: "error in adding images",
    });
  }
});

router.get("", checkAuth,(req, res, next) => {
  console.log("inside get request start");
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
      getBucketContents(bucket).then(() => {
        console.log("totalFilesList.length:",bucketFilesList.length);
        targetFiles = bucketFilesList;
        targetFiles.forEach(file => {
          if (path.extname(file).toLowerCase() == ".tif" || path.extname(file).toLowerCase() == ".png" || path.extname(file).toLowerCase() == ".jpg" ||
          path.extname(file).toLowerCase() == ".bmp") {
            fetchedImages.push(file.trim());
            // console.log("image files["+file+"]");
          } else if(path.extname(file).toLowerCase() == ".xml") {
            xmlArrayList.push(file.toLowerCase());
            // console.log("xml files["+file+"]");
          }
        });
        if (fetchedImages.length > 0) {
          fetchedImages.forEach(files => {
            console.log("fetchedImages name",files);
            const xmlFile = files.slice(0, -3).toLowerCase() + 'xml';
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
          imageList.forEach(files => {
            console.log("files.fileName "+files.fileName+" files.completed",files.completed);
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
});

router.get("/:fileName", checkAuth,(req, res, next) =>{
  const mail = req.query.user;
  let fetchedUser;
  let jpegFile = req.params.fileName;
  const fileName = req.params.fileName;
  console.log("req.params.fileName",jpegFile);
  if (path.extname(jpegFile).toLowerCase() == ".tif") {
    jpegFile = jpegFile.slice(0, -3).toLowerCase() + 'jpg';
  }
  User.findOne({ email: mail })
  .then(user => {
    if (!user) {
      return res.status(401).json({
        message: "Auth failed"
      });
    }
    fetchedUser = user;
    console.log("inside get File mail"+req.query.user);
    getItem(bucket, jpegFile, req.query.user,"getRequest").then((data) => {
      if(data == "The specified key does not exists in bucket") {
        console.log("error while retrieving image:",data);
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
});

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


// -------------> Unused code for reference <----------------

// const MIME_TYPE_MAP = {
//   "image/png": "png",
//   "image/jpeg": "jpg",
//   "image/jpg": "jpg",
//   "image/tiff": "tif"
// };


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
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
//         const isValid = MIME_TYPE_MAP[file.mimetype];
//         // console.log("file name "+file.originalname);
//         // console.log("book name "+bookName);
//         const image_wav_dir = './backend/images/' + req.body.email + '/'
//         let error = new Error("Invalid mime type");
//         var fs = require('fs');
//         let dir = image_wav_dir;
//         if (!fs.existsSync(dir)) {
//           fs.mkdirSync(dir, { recursive: true });
//         }

//         if (isValid) {
//           error = null;
//         }

//         cb(error, dir);
//       });
//   },
//   filename: (req, file, cb) => {
//     const name = file.originalname
//       .toLowerCase()
//       .split(" ")
//       .join("-");
//     const ext = MIME_TYPE_MAP[file.mimetype];
//     cb(null, name);
//   }
// });

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


module.exports = router;
