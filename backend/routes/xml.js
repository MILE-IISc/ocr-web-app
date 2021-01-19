const express = require("express");
const fs = require("fs");
var path = require('path');
var xml2js = require('xml2js');
var js2xmlparser = require("js2xmlparser");
const router = express.Router();
const { promise } = require("protractor");
var util = require('util');

const checkAuth = require("../middleware/check-auth");
const Image = require("../models/image");
const User = require("../models/user");

const cloudStorage = require('ibm-cos-sdk');
const bucket = process.env.OBJECT_STORAGE_BUCKET;
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

function doCreateObject(xmlFileName, xmlData) {
  console.log('Creating xmlFile',xmlFileName);
  return cos.putObject({
      Bucket: bucket,
      Key: xmlFileName,
      Body: xmlData
  }).promise();
}

function getItem(bucketName, itemName) {
  console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
  return cos.getObject({
      Bucket: bucketName,
      Key: itemName
  }).promise()
  .then((data) => {
      if (data != null) {
        console.log('File Contents:\n' + Buffer.from(data.Body).toString());
        return Buffer.from(data.Body).toString();
      }
  })
  .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
      return "The specified key does not exists in bucket";
  });
}

router.put("", checkAuth, (req, res, next) => {
  xmlFileName = req.body.XmlfileName;
  editor = req.userData.email;
  const user_xml_dir = './backend/images/' + editor + '/';
  var fs = require('fs');
  let dir = user_xml_dir;
  // if (!fs.existsSync(dir)) {
  //   fs.mkdirSync(dir);
  // }
  var json = req.body.json;

  // console.log("converting this json "+js2xmlparser.parse("page",json));
  var formattedXml = js2xmlparser.parse("page",json).split("\n");


  formattedXml.splice(1, 1);
  formattedXml.splice(-1, 1);

    doCreateObject(xmlFileName, formattedXml.join("\n")).then(() => {
    console.log("saved xml file");
    res.status(200).json({
      message: "XML File saved successfully!",
      completed: "Y"
    });
  }).catch((err) => {
    console.log("error while saving xml file:",err);
    res.status(500).json({
      message: "Couldn't save Text File. err: " + err,
      completed: "N"
    });
  });
});

router.get("/:fileName", checkAuth,(req, res, next) =>{
  console.log("in run ocr get ")
  editor = req.userData.email
  const XmlfileName = req.params.fileName;
  console.log("XmlfileName in get call "+XmlfileName);
  const user_wav_dir = './backend/images/'+ editor + '/' + XmlfileName;
  // getItem(bucket, XmlfileName);
  getItem(bucket, XmlfileName).then(content => {
    if(content == "The specified key does not exists in bucket") {
      console.log("error while retrieving:",content);
      res.status(400).json({
        message: content,
        json: ""
      });
    }
    else {
      console.log("xml.js retrieved content:",content);
      xml2js.parseString(content,{ mergeAttrs: true } ,function (err, result) {
        // var books = result['bookstore']['book'];
        var jsonString = JSON.stringify(result)
        console.log("xml.js result as JSON "+jsonString);
        res.status(201).json({
          message: "xml read successfully",
          json: result
        });
      });
    }
  });
});

router.get("", checkAuth,(req, res, next) =>{
  console.log("in run ocr get ")
  const XmlfileName = req.query.fileName;
  console.log("XmlfileName in get call "+XmlfileName);
  // getItem(bucket, XmlfileName);
  getItem(bucket, XmlfileName).then(content => {
    if(content == "The specified key does not exists in bucket") {
      console.log("error while retrieving:",content);
      res.status(400).json({
        message: content,
        xmlData: ""
      });
    }
    else {
      console.log("xml.js retrieved content:",content);
      res.status(201).json({
        message: "xml read successfully",
        xmlData: content
      });
    }
  });
});


module.exports = router;
