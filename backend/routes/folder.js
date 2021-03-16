const authChecker = require("../middleware/auth-checker");
const express = require("express");
const router = express.Router();
var path = require('path');
const couch = require('../controllers/couch');

const cloudStorage = require('ibm-cos-sdk');
const bucketFilesList = [];

var config = {
  endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
  apiKeyId: process.env.OBJECT_STORAGE_API_KEY_ID,
  ibmAuthEndpoint: process.env.OBJECT_STORAGE_IBM_AUTH_ENDPOINT,
  serviceInstanceId: process.env.OBJECT_STORAGE_SERVICE_INSTANCE_ID,
};

var cos = new cloudStorage.S3(config);

function getItem(bucketName, itemName, mail, requestType) {
  return cos.getObject({
    Bucket: bucketName,
    Key: itemName
  }).promise()
    .then((data) => {
      if (data != null) {
        var splitFileName = itemName.split("-");
        if (path.extname(splitFileName[0]).toLowerCase() == ".tif" && requestType == "POST") {
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
              .writeAsync('./images/' + mail + "/" + splitFileName[0].slice(0, -3) + 'jpg').then(() => {
                console.log("file is ready for", mail, " fileName ", splitFileName[0].slice(0, -3).toLowerCase() + 'jpg');
                // console.log("image content retrieved and converted");
                let tiffToJpg = splitFileName[0].slice(0, -3) + 'jpg';
                const filePath = './images/' + mail + "/" + tiffToJpg;
                console.log("file Path " + filePath);
                console.log("calling multiPartUpload");
                multiPartUpload(bucketName, tiffToJpg + "-" + splitFileName[1], filePath);
              });
          });
        }
        else if (path.extname(splitFileName[0]).toLowerCase() == ".png" || path.extname(splitFileName[0]).toLowerCase() == ".jpg" || path.extname(splitFileName[0]).toLowerCase() == ".bmp") {
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

router.post("", authChecker, (req, res, next) => {
  let folderName = req.body.folderName;
  let perUserDb = req.body.userDbName;
  let bookDb = "";
  bookInfo = {
    "bookName": folderName,
    "bookId": "",
    "bookThumbnailImage": ""
  }
  couch.checkDatabase(perUserDb).then(async (dbStatus) => {
    console.log("checked Database existence", dbStatus);
    if (!dbStatus) {
      console.log("perUserDb doesn't exists for", perUserDb, "relogin to upload files");
      return res.status(401).json({
        message: "Auth failed - Login back to upload files"
      });
    } else {
      await couch.findBook(perUserDb, folderName).then(async (response) => {
        console.log("Got Output from find document for bookName", folderName, "in", perUserDb, "documents", response.documents.docs.length);
        if (response.statusCode == 404) {
          // inserting new document as bookName doesn't exists in perUserDb
          await couch.insertDocument(perUserDb, bookInfo).then((result) => {
            console.log("insert Book Document result", result);
            if (result.ok == true) {
              bookDb = "mile_book_db_" + result.id;
              console.log("Book has been inserted with id", bookDb, "which will be used as bookDbName");
            } else {
              console.log("Inserting Book document to perUserDB failed");
            }
          });
        } else {
          if (response.documents.docs.length == 1) {
            bookDb = "mile_book_db_" + response.documents.docs[0]._id;
            console.log("Book is already available in perUserDb with id", bookDb, "which will be used as bookDbName");
          }
        }
        // common code for handling if bookInfoDocument is present or not in perUserDb
        couch.checkDatabase(bookDb).then(async (dbStatus) => {
          console.log("checked Database existence for", bookDb, "with status", dbStatus);
          if (!dbStatus) {
            console.log("creating db for bookId", bookDb);
            dbCreationStatus = await couch.createDatabase(bookDb).then(status => {
              console.log("database creation successful", status);
              return status;
            }).catch((err) => {
              console.log(err);
            });
          }
          couch.getDbSecurity(perUserDb).then((dbSecurity) => {
            securityInfo = {};
            console.log("dbSecurity from userDb in folder.js", dbSecurity);
            if (Object.keys(dbSecurity).length == 1) {
              securityInfo = dbSecurity;
            }
            couch.copyDbSecurity(bookDb, securityInfo).then((access) => {
              console.log("permission granted successfully for bookDb:", bookDb, "with key:", access.key, "with password:", access.password);
              console.log("Sending book database creation response");
              res.status(201).json({
                message: "bookInfo added!",
                bookDbName: bookDb,
                bookDbKey: access.key
              });
            }).catch((err) => {
              console.log("error while replicating security config from perUserDb to bookDb", err);
            });
          })
        }).catch((err) => {
          console.log("error while granting permission for userdb", err);
        });
      });
    }
  }).catch((err) => {
    console.log("BookInfo Db Update failed", err);
  });
});

// router.get("", (req, res, next) => {
//   const mail = req.query.user;
//   let fetchedUser;
//   let books = [];
//   User.findOne({ email: mail })
//     .then(user => {
//       if (!user) {
//         return res.status(401).json({
//           message: "Auth failed"
//         });
//       }
//       fetchedUser = user;
//       if (fetchedUser.booksAssigned.length > 0) {
//         //getBucketContest --> array
//         for (let i = 0; i < fetchedUser.booksAssigned.length; i++) {
//           console.log("book name" + fetchedUser.booksAssigned[i]);
//           // parse through that bucketcontentlist array fill the bookarray(will file name coreresponding to folders)
//           const book = {
//             folderName: fetchedUser.booksAssigned[i]
//           };
//           books.push(book);
//         }
//         res.status(200).json({
//           message: "Books Available",
//           book: books
//         });
//       } else {
//         res.status(200).json({
//           message: "No Books Are Available",
//           book: books
//         });
//       }

//     });
// });

router.get("/:folderName", authChecker, (req, res, next) => {
  const folderName = req.params.folderName;
  var fetchedImages = [];
  var tiffImages = [];
  var jpegImages = [];
  let xmlArrayList = [];

  bucketName = req.userData.bucketName;
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
    fetchedImages.sort((a, b) => a.localeCompare(b));
    if (fetchedImages.length > 0) {
      let jpegFile = fetchedImages[0];
      if (path.extname(jpegFile).toLowerCase() == ".tif") {
        jpegFile = jpegFile.slice(0, -3) + 'jpg';
      }
      getItem(bucketName, jpegFile + "-" + folderName, req.query.user, "GET").then((data) => {
        if (data == "The specified key does not exists in bucket") {
          console.log("error while retrieving image:", data);
          res.status(200).json({
            message: data,
            json: ""
          });
        }
        else {
          res.status(200).json({
            message: "image fetched successfully",
            json: data,
            fileList: fetchedImages
          });
        }
      });
    }
  });
});

router.delete("/:bookName", authChecker, (req, res, next) => {
  let bookName = req.params.bookName;
  res.status(200).json({
    message: "Deletion is yet to be implemented",
    completed: "N"
  });
  console.log("delete book",bookName);
  // User.updateOne(
  //   { $pull: { "booksAssigned": { $in: [bookName] } } }
  // ).then(result => {
  //   if (result.nModified == 1) {
  //     res.status(200).json({
  //       message: "Book deleted successfully",
  //       completed: "Y"
  //     });
  //   } else {
  //     res.status(200).json({
  //       message: "Deletion failed",
  //       completed: "N"
  //     });
  //   }
  // }).catch(error => {
  //   res.status(500).json({
  //     message: "booksAssigned update failed !!!"
  //   });
  // });
});

module.exports = router;
