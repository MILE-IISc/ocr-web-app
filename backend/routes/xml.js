const express = require("express");
const fs = require("fs");
var path = require('path');
var xml2js = require('xml2js');
var js2xmlparser = require("js2xmlparser");
const router = express.Router();
const { promise } = require("protractor");
var util = require('util');


var request = require("request");
// var utf8 = require('utf8');

const checkAuth = require("../middleware/check-auth");
const Image = require("../models/image");
const User = require("../models/user");

const cloudStorage = require('ibm-cos-sdk');
// const bucket = process.env.OBJECT_STORAGE_BUCKET;
var config = {
  endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
  apiKeyId: process.env.OBJECT_STORAGE_API_KEY_ID,
  ibmAuthEndpoint: process.env.OBJECT_STORAGE_IBM_AUTH_ENDPOINT,
  serviceInstanceId: process.env.OBJECT_STORAGE_SERVICE_INSTANCE_ID,
};

var cos = new cloudStorage.S3(config);

function doCreateObject(bucketName, xmlFileName, xmlData) {
  console.log('Creating xmlFile',xmlFileName);
  return cos.putObject({
      Bucket: bucketName,
      Key: xmlFileName,
      Body: xmlData
  }).promise();
}

function getItem(bucketName, itemName, type) {
  console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
  if(type == "OCR") {
    itemName = itemName
  }
  console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
  return cos.getObject({
      Bucket: bucketName,
      Key: itemName
  }).promise()
  .then((data) => {
      if (data != null) {
        // console.log('File Contents:\n' + Buffer.from(data.Body).toString());
        if(type == "OCR") {
          console.log("tiff ",data.Metadata);
          console.log("tiff ",data.ContentType);
          const tiffArrayBuff = Buffer.from(data.Body).buffer;

          TiffBase64Data = Buffer.from(tiffArrayBuff).toString('base64');
          // console.log("TiffBase64Data",TiffBase64Data);
          return TiffBase64Data;
        }
        else {
          return Buffer.from(data.Body).toString();
        }
      }
  })
  .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
      return "The specified key does not exists in bucket";
  });
}

router.put("", checkAuth, (req, res, next) => {
  xmlFileName = req.body.XmlfileName;
  const mail = req.userData.email;
  const bucketName = req.userData.bucketName;
  console.log("bucketName inside put XML ",bucketName);
  console.log("mail inside put XML ",mail);
  var xmlDocument = document.implementation.createDocument(ns1, "page", null);

  var json = req.body.json;
  //testing starts here
  console.log("initial XML json",JSON.stringify(json));
  let xmlString = JSON.stringify(json);
  attr = ' xmlns = \"http://mile.ee.iisc.ernet.in/schemas/ocr_output\"'
  appendedString = xmlString.substring(6,0)+attr+xmlString.substring(7,xmlString.length);
  console.log("xmlString after appending",appendedString);
  xml2js.parseString(xmlString, { mergeAttrs: true }, function (err, result) {
    if(err) {
      console.log("error while parsing",err);
    }
    console.log("\n\n");
    console.log("result",result);
    console.log("xml.js result as JSON before adding attribute" + JSON.stringify(result));
  });
  //testing ends here
  console.log("xml content in put request ",JSON.stringify(json));
  var formattedXml = js2xmlparser.parse("page",json).split("\n");
  formattedXml.splice(1, 1);
  formattedXml.splice(-1, 1);

  console.log("formattedXml content in put request ",formattedXml);

  doCreateObject(bucketName, xmlFileName, formattedXml.join("\n")).then(() => {
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
  console.log("in xml get fileName")
  // const mail = req.query.user;
  const mail = req.userData.email;
  const bucketName = req.userData.bucketName;
  console.log("bucketName inside get fileName XML ",bucketName);
  console.log("mail inside get fileName XML ",mail);

  console.log("ImagefileName in get XML fileName call "+req.params.fileName);
  const XmlfileName = req.params.fileName.slice(0,-3) + 'xml';
  console.log("XmlfileName in get XML fileName call "+XmlfileName);
  getItem(bucketName, XmlfileName,"GET").then(content => {
    if(content == "The specified key does not exists in bucket") {
      console.log("error while retrieving:",content);
      res.status(400).json({
        message: content,
        xmlData: ""
      });
    }
    else {
      console.log("content  retrieved for downloading XML:",content);
      res.status(201).json({
        message: "xml read successfully",
        xmlData: content
      });
    }
  });
});


router.get("", checkAuth,(req, res, next) =>{
  console.log("in run ocr xml get fileName")
  const mail = req.userData.email;
  const bucketName = req.userData.bucketName;
  console.log("bucketName inside get fileName XML ",bucketName);
  console.log("mail inside get fileName XML ",mail);
  console.log("fileName inside get XML ",req.query.fileName);
  console.log("type inside get XML ",req.query.type);
  if(req.query.type == "GET-XML") {
    const XmlfileName = req.query.fileName.slice(0,-3) + 'xml';
    console.log("XmlfileName in get call "+XmlfileName);
    getItem(bucketName, XmlfileName, "GET").then(content => {
      if(content == "The specified key does not exists in bucket") {
        console.log("error while retrieving:",content);
        res.status(400).json({
          message: content,
          xmlData: ""
        });
      }
      else {
        // console.log("content retrieved for XML",content);
        xml2js.parseString(content,{ explicitArray: false } ,function (err, result) {
          var jsonString = JSON.stringify(result);
          // console.log("xml result as JSON in "+jsonString);
          res.status(201).json({
            message: "xml read successfully",
            xmlData: result
          });
        });
      }
    });
  }
  else if(req.query.type == "GET-OCR-XML"){
    const XmlfileName = req.query.fileName.slice(0,-3) + 'xml';
    console.log("XmlfileName in get call "+XmlfileName);
    getItem(bucketName, XmlfileName, "GET").then(content => {
      if(content == "The specified key does not exists in bucket") {
        console.log("error while retrieving:",content);
        res.status(400).json({
          message: content,
          xmlData: ""
        });
      }
      else {
        // console.log("content retrieved for XML while running OCR:",content);
        console.log("getting Tiff Data for",req.query.fileName);

        getItem(bucketName, req.query.fileName, "OCR").then(imgContent => {
          if(imgContent == "The specified key does not exists in bucket") {
            console.log("error while retrieving:",imgContent);
            res.status(400).json({
              message: imgContent,
              xmlData: ""
            });
          }
          else {
            console.log("Tiff Base64String retrieved in get Request for RUN-OCR");
            console.log("Tiff Base64String retrieved in get Request for RUN-OCR:",  );

            request.post({
                url:"http://169.38.86.210:9080",
                port: 9080,
                method:"POST",
                headers:{
                    'Content-Type': 'application/xml',
                },
                 body: content
            },
            function(error, response, body){
                console.log(response.statusCode);
                console.log(body);
                console.log(error);
                res.status(201).json({
                  message: "Tiff base64 String retrieved successfully",
                  json: body
                });
            });
            // xml2js.parseString(content,{ mergeAttrs: true } ,function (err, result) {
            //   var jsonString = JSON.stringify(result)
            //   console.log("xml.js result as JSON "+jsonString);
            //   res.status(201).json({
            //     message: "xml read successfully",
            //     json: result
            //   });
            // });
          }
        });
      }
    });
  }
});


module.exports = router;
