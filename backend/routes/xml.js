const express = require("express");
const fs = require("fs");
var path = require('path');
var xml2js = require('xml2js');
var js2xmlparser = require("js2xmlparser");
const router = express.Router();
var format = require('xml-formatter');
const { promise } = require("protractor");
var util = require('util');
var request = require("request");
const authChecker = require("../middleware/auth-checker");
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
  console.log('Creating xmlFile', xmlFileName);
  return cos.putObject({
    Bucket: bucketName,
    Key: xmlFileName,
    Body: xmlData
  }).promise();
}

function getItem(bucketName, itemName, type) {
  console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
  return cos.getObject({
    Bucket: bucketName,
    Key: itemName
  }).promise()
    .then((data) => {
      if (data != null) {
        if (type == "OCR") {
          console.log("image Metadata", data.Metadata);
          console.log("image Type", data.ContentType);
          if (data.ContentType == "image/tiff") {
            console.log("inside get Tiff image base64");
            const tiffArrayBuff = Buffer.from(data.Body).buffer;
            base64Data = Buffer.from(tiffArrayBuff).toString('base64');
            return base64Data;
          }
          console.log("inside get normal image base64");
          base64Data = Buffer.from(data.Body).toString('base64');
          return base64Data;
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

router.put("", authChecker, (req, res, next) => {
  fileName = req.body.XmlfileName;
  const mail = req.userData.email;
  const bucketName = req.userData.bucketName;
  const bookName = req.query.folderName;
  xmlFileName = fileName + "-" + bookName;
  console.log("bucketName inside put XML ", bucketName);
  console.log("mail inside put XML ", mail);
  console.log("xmlFileName inside put XML ", xmlFileName);
  var json = req.body.json;
  console.log("xml content in put request ", JSON.stringify(json));

  var builder = new xml2js.Builder();
  var formattedXml = builder.buildObject(json);

  console.log("formattedXml " + formattedXml);

  doCreateObject(bucketName, xmlFileName, formattedXml).then(() => {
    console.log("saved xml file");
    res.status(200).json({
      message: "XML File saved successfully!",
      completed: "Y"
    });
  }).catch((err) => {
    console.log("error while saving xml file:", err);
    res.status(500).json({
      message: "Couldn't save Text File. err: " + err,
      completed: "N"
    });
  });
});

router.get("/:fileName", authChecker, (req, res, next) => {
  console.log("in xml get fileName")
  // const mail = req.query.user;
  const mail = req.userData.email;
  const bucketName = req.userData.bucketName;
  console.log("bucketName inside get fileName XML ", bucketName);
  console.log("mail inside get fileName XML ", mail);

  console.log("ImagefileName in get XML fileName call " + req.params.fileName);
  const fileName = req.params.fileName.split("-");
  const xmlFileName = fileName[0].slice(0, -3) + 'xml';
  console.log("xmlFileName in get XML fileName call " + xmlFileName);
  getItem(bucketName, xmlFileName + "-" + fileName[1], "GET").then(content => {
    if (content == "The specified key does not exists in bucket") {
      console.log("error while retrieving:", content);
      res.status(400).json({
        message: content,
        xmlData: ""
      });
    }
    else {
      console.log("content  retrieved for downloading XML:", content);
      res.status(201).json({
        message: "xml read successfully",
        xmlData: content
      });
    }
  });
});


router.get("", authChecker, (req, res, next) => {
  console.log("in run ocr xml get fileName")
  const mail = req.userData.email;
  const bucketName = req.userData.bucketName;
  console.log("bucketName inside get fileName XML ", bucketName);
  console.log("mail inside get fileName XML ", mail);
  console.log("fileName inside get XML ", req.query.fileName);
  console.log("type inside get XML ", req.query.type);
  if (req.query.type == "GET-XML") {
    const fileName = req.query.fileName.split("-");
    const name = fileName[0].slice(0, -3) + 'xml';
    const xmlFileName = name + "-" + fileName[1];
    console.log("xmlFileName in get call " + xmlFileName);
    getItem(bucketName, xmlFileName, "GET").then(xmlContent => {
      if (xmlContent == "The specified key does not exists in bucket") {
        console.log("error while retrieving:", xmlContent);
        res.status(400).json({
          message: xmlContent,
          xmlData: ""
        });
      }
      else {
        // console.log("xmlContent retrieved for XML",xmlContent);
        xml2js.parseString(xmlContent, function (err, result) {
          // console.log("xml result as JSON in " + JSON.stringify(result));
          res.status(201).json({
            message: "xml read successfully",
            xmlData: result
          });
        });
      }
    });
  }  else if (req.query.type == "GET-OCR-XML" || req.query.type == "GET-OCR-XML-ALL") {
    const fileName = req.query.fileName.split("-");
    const name = fileName[0].slice(0, -3) + 'xml';
    const xmlFileName = name + "-" + fileName[1];
    const ocrFileName = fileName[0] + "-" + 
    console.log("xmlFileName in get call " + xmlFileName);
    getItem(bucketName, xmlFileName, "GET").then(xmlContent => {
      if (xmlContent == null || xmlContent.localeCompare("") == 0 || xmlContent.localeCompare("The specified key does not exists in bucket") == 0) {
        xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <page xmlns="http://mile.ee.iisc.ernet.in/schemas/ocr_output">
        </page>`;
      }
      console.log("getting Image Data for", req.query.fileName);
      getItem(bucketName, req.query.fileName, "OCR").then(imgContent => {
        if (imgContent == null || imgContent.localeCompare("") == 0 || imgContent.localeCompare("The specified key does not exists in bucket") == 0) {
          var statusCode = req.query.type == "GET-OCR-XML" ? 400 : 200;
          res.status(statusCode).json({
            message: "Couldn't find the uploaded image on server",
            xmlData: "",
            completed: "N"
          });
        } else {
          xml2js.parseString(xmlContent, (err, result) => {
            if (err) {
              var statusCode = req.query.type == "GET-OCR-XML" ? 500 : 200;
              res.status(statusCode).send({
                message: "Internal server error - xml2js.parseString failed",
                xmlData: "",
                completed: "N"
              });
            }
            result["page"]["imageData"] = imgContent;
            const builder = new xml2js.Builder();
            xmlContent = builder.buildObject(result);
            request.post({
              url: process.env.RUN_OCR_ADDRESS,
              port: process.env.RUN_OCR_PORT,
              method: "POST",
              headers: {
                'Content-Type': 'application/xml',
              },
              body: xmlContent
            }, function (error, response, body) {
              if (response.statusCode == 200) {
                doCreateObject(bucketName, xmlFileName, body).then(() => {
                  if (req.query.type == "GET-OCR-XML") {
                    xml2js.parseString(body, function (err, result) {
                      res.status(201).json({
                        message: "OCR completed on " + req.query.fileName,
                        completed: "Y",
                        xmlData: result
                      });
                    });
                  } else {
                    res.status(201).json({
                      message: "OCR completed on " + req.query.fileName,
                      completed: "Y"
                    });
                  }
                }).catch((error) => {
                  console.log("Error while saving XML to COS: ", error);
                  var statusCode = req.query.type == "GET-OCR-XML" ? 500 : 200;
                  res.status(statusCode).json({
                    message: "Internal server error - Failed to save OCR XML to object storage: " + error,
                    xmlData: "",
                    completed: "N"
                  });
                });
              } else {
                console.log("Error occurred while running the OCR: ", error);
                var statusCode = req.query.type == "GET-OCR-XML" ? 500 : 200;
                res.status(statusCode).json({
                  message: "Internal server error occurred while running the OCR: " + error,
                  xmlData: "",
                  completed: "N"
                });
              }
            });
          });
        }
      });
    });
  }
});


module.exports = router;
