const express = require("express");
const fs = require("fs");
var path = require('path');
const router = express.Router();
const { promise } = require("protractor");
var JSZip = require('jszip');
const authChecker = require("../middleware/auth-checker");

const cloudStorage = require('ibm-cos-sdk');
var config = {
  endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
  apiKeyId: process.env.OBJECT_STORAGE_API_KEY_ID,
  ibmAuthEndpoint: process.env.OBJECT_STORAGE_IBM_AUTH_ENDPOINT,
  serviceInstanceId: process.env.OBJECT_STORAGE_SERVICE_INSTANCE_ID,
};
var cos = new cloudStorage.S3(config);

function getBucketContents(bucketName) {
  console.log(`Retrieving bucket contents from: ${bucketName}`);
  return cos.listObjects(
    { Bucket: bucketName },
  ).promise()
    .then((data) => {
      if (data != null && data.Contents != null) {
        var bucketFilesList = [];
        for (var i = 0; i < data.Contents.length; i++) {
          var itemKey = data.Contents[i].Key;
          var itemSize = data.Contents[i].Size;
          bucketFilesList.push(itemKey);
        }
        return bucketFilesList;
      }
    })
    .catch((e) => {
      console.error(`Error while fetching contents of bucket={bucketName}: ${e.code} - ${e.message}\n`);
      return "";
    });
}

function getItem(bucketName, itemName, type) {
  return cos.getObject({
    Bucket: bucketName,
    Key: itemName
  }).promise()
    .then((data) => {
      if (data != null) {
        return Buffer.from(data.Body).toString();
      }
    })
    .catch((e) => {
      console.error(`Error while fetching item={itemName} from bucket={bucketName}: ${e.code} - ${e.message}\n`);
      return null;
    });
}

router.get("", authChecker, (req, res, next) => {
  bucketName = req.userData.bucketName;
  getBucketContents(bucketName).then((bucketFilesList) => {
    let xmlFileNames = [];
    bucketFilesList.forEach(fileName => {
      if (path.extname(fileName).toLowerCase() == ".xml") {
        xmlFileNames.push(fileName);
      }
    });
    var zip = new JSZip();
    var folder = zip.folder(bucketName + "_xml_files");
    var count = 0;
    xmlFileNames.forEach(fileName => {
      getItem(bucketName, fileName, "GET").then(xmlContent => {
        count++;
        if (xmlContent != null) {
          folder.file(fileName, xmlContent);
        }

        if (count == xmlFileNames.length) {
          var zipFileName = bucketName + '_xml_files.zip';
          zip
            .generateNodeStream({ streamFiles: true })
            .pipe(fs.createWriteStream(zipFileName))
            .on('finish', function () {
              console.log("Sending ZIP of XML files {zipFileName}");
              // res.setHeader('Content-disposition', 'attachment; filename=out.zip');
              // res.sendFile(zipFileName);
              res.download(zipFileName);
            })
        }
      });
    });
  });
});

module.exports = router;
