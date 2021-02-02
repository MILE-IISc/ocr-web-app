const express = require("express");
const fs = require("fs");
var path = require('path');
const router = express.Router();
const { promise } = require("protractor");
var JSZip = require('jszip');
var request = require("request");
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
    }).catch((e) => {
      console.error(`Error while fetching item=${itemName} from bucket=${bucketName}: ${e.code} - ${e.message}\n`);
      return null;
    });
}

function getXmlConvertToAltoAndAddToZip(fileName, folder) {
  return new Promise((resolve, reject) => {
    getItem(bucketName, fileName, "GET").then(xmlContent => {
      if (xmlContent != null) {
        console.log(`Fetched XML: ${fileName} from COS. Converting it to ALTO XML ...`);
        request.post({
          url: process.env.RUN_OCR_ADDRESS + "/convert",
          port: process.env.RUN_OCR_PORT,
          method: "POST",
          headers: {
            'Content-Type': 'application/xml',
          },
          body: xmlContent
        }, function (error, response, body) {
          if (response.statusCode == 200) {
            console.log(`Converted ${fileName} to ALTO XML`);
            folder.file(fileName, body);
            console.log(`Added ${fileName} to ZIP folder`);
            resolve(true);
          } else {
            console.log("Error while converting to ALTO XML: " + error);
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    });
  });
}

router.get("", authChecker, (req, res, next) => {
  bucketName = req.userData.bucketName;
  getBucketContents(bucketName).then((bucketFilesList) => {
    console.log(`Got list of objects inside the bucket: ${bucketName}. Count = ${bucketFilesList.length}`);
    let xmlFileNames = [];
    bucketFilesList.forEach(fileName => {
      if (path.extname(fileName).toLowerCase() == ".xml") {
        xmlFileNames.push(fileName);
      }
    });
    console.log(`Count of XML files = `, xmlFileNames.length);

    var zip = new JSZip();
    var folder = zip.folder(bucketName + "_xml_files");

    var n = xmlFileNames.length;
    function processXml(i, cb) {
      getXmlConvertToAltoAndAddToZip(xmlFileNames[i - 1], folder).then((data) => {
        if (i == n) {
          cb();
          return;
        }
        // "Asynchronous recursion".
        // Schedule next operation asynchronously.
        setImmediate(processXml.bind(null, i + 1, cb));
      });
    };
    function createZip() {
      console.log(`Processed all XML files. Creating zip file now.`);
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
    };
    processXml(1, createZip);
  });
});

module.exports = router;
