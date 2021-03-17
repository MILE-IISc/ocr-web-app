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
const couch = require('../controllers/couch');

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
          if (path.extname(itemName).toLowerCase() == ".tif") {
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
  console.log("dbName inside get XML ", req.query.bookDb);
  console.log("type inside get XML ", req.query.type);
  if (req.query.type == "GET-OCR-XML" || req.query.type == "GET-OCR-XML-ALL") {
    const fileName = req.query.fileName;
    const xmlFileName = fileName.slice(0, -3) + 'xml';
    const currentBookDb = req.query.bookDb;
    var xmlJsonObject;
    var pageDocument = {};
    console.log("xmlFileName in get call " + xmlFileName);
    // CouchDb code starts here
    couch.checkDatabase(currentBookDb).then(async (dbStatus) => {
      console.log("checked Database existence for", currentBookDb, "with status", dbStatus);
      if (!dbStatus) {
        console.log("Unable connect to bookDb", currentBookDb);
        res.status(200).json({
          message: "Unable to connect to book database",
          completed: "N"
        });
      } else {
        await couch.findPage(currentBookDb, xmlFileName).then(async (response) => {
          console.log("Got Output from find document for pageName", xmlFileName, "in", currentBookDb, "no. of documents", response.documents.docs.length);
          if (response.statusCode == 404) {
            console.log("documnet not found. So, setting default page xml");
            xmlJsonObject = {
              "page": {
               "$": {
                "xmlns": "http://mile.ee.iisc.ernet.in/schemas/ocr_output"
               }
              }
            }
          } else {
            if(response.documents.docs.length == 1) {
              pageDocument = response.documents.docs[0];
              console.log("pageDocument",pageDocument);
              xmlJsonObject = pageDocument.data;
            } else {
              console.log("Multiple XML documents found in book database", currentBookDb);
              res.status(200).json({
                message: "Multiple XML documents found in book database",
                completed: "N"
              });
            }
          }
          console.log("xmlContent in RUN-OCR",xmlJsonObject);
          console.log("getting Image Data for", req.query.fileName);
          getItem(bucketName, req.query.fileName, "OCR").then( (imgContent) => {
            if (imgContent == null || imgContent.localeCompare("") == 0 || imgContent.localeCompare("The specified key does not exists in bucket") == 0) {
              var statusCode = req.query.type == "GET-OCR-XML" ? 400 : 200;
              res.status(statusCode).json({
                message: "Couldn't find the uploaded image on server",
                completed: "N"
              });
            } else {
              // console.log("got Tiff imageData");
              xmlJsonObject["page"]["imageData"] = imgContent;
              // console.log("initiating xmlBuilder");
              const builder = new xml2js.Builder();
              // console.log("initiated xmlBuilder");
              xmlContent = builder.buildObject(xmlJsonObject);
              // console.log("posting OCR request");
              request.post({
                url: process.env.RUN_OCR_ADDRESS,
                port: process.env.RUN_OCR_PORT,
                method: "POST",
                headers: {
                  'Content-Type': 'application/xml',
                },
                body: xmlContent
              }, function (error, response, body) {
                if (error) {
                  console.log("Error occurred while running the OCR: ", error);
                  var statusCode = req.query.type == "GET-OCR-XML" ? 500 : 200;
                  res.status(statusCode).json({
                    message: "Internal server error occurred while running the OCR: " + error.code,
                    completed: "N"
                  });
                } else if (error == null && response.statusCode == 200) {
                  // console.log("response body on RUN-OCR",body);
                  xml2js.parseString(body, async function (err, result) {
                    console.log("xml2js.parseString result after RUN-OCR",result);
                    let now = new Date();
                    let date = now.toUTCString();
                    if(pageDocument && Object.keys(pageDocument).length === 0 && pageDocument.constructor === Object) {
                      console.log("Insert new XML document");
                      pageDocument._id = xmlFileName;
                      pageDocument.pageName = xmlFileName;
                      pageDocument.data = result;
                      pageDocument.LastModified = date;
                    } else {
                      console.log("Update existing XML document");
                      pageDocument.data = result;
                      pageDocument.LastModified = date;
                    }
                    await couch.insertDocument(currentBookDb, pageDocument).then((result) => {
                      console.log("insert page Document result", result);
                      if (result.ok == true) {
                        console.log("page document has been inserted into database", currentBookDb);
                      } else {
                        console.log("Inserting page document to bookDb failed");
                      }
                    });
                    res.status(201).json({
                      message: "OCR completed on " + req.query.fileName,
                      completed: "Y"
                    });
                  });
                } else {
                  console.log("Got non 200 response code", response.statusCode,"response.statusMessage", response.statusMessage);
                  var statusCode = req.query.type == "GET-OCR-XML" ? 500 : 200;
                  res.status(statusCode).json({
                    message: "Internal server error occurred while running the OCR: " + response.statusMessage,
                    completed: "N"
                  });
                }
              });
            }
          }).catch((err) => {
            console.log("Couldn't find the uploaded image on server", err);
            res.status(200).json({
              message: "Couldn't find the uploaded image on server",
              completed: "N"
            });
          });
        });
      }
    }).catch((err) => {
      console.log("error while running OCR", err);
      res.status(200).json({
        message: "error while running OCR",
        completed: "N"
      });
    });
    // return;
    // CouchDb code ends here
  }
});


module.exports = router;
