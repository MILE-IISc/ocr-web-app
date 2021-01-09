const express = require("express");
const fs = require("fs");
var path = require('path');
var async = require('async');
var format = require('xml-formatter');
var xml2js = require('xml2js');
var js2xmlparser = require("js2xmlparser");
const router = express.Router();
const { promise } = require("protractor");
var util = require('util');

const checkAuth = require("../middleware/check-auth");
// const extractFile = require("../middleware/file"); extractFile,
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


router.put("/:id", checkAuth, (req, res, next) => {
  console.log("fileName" + req.body.fileName)
  imageFileName = req.body.fileName;
  editor = req.userData.email
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

  console.log("formattedXml\n",formattedXml);
  doCreateObject(xmlFileName, formattedXml).then(() => {
    console.log("saved xml file");
    res.status(200).json({ message: "XML File saved successfully!"});
  }).catch((err) => {
    console.log("error while saving xml file:",err);
    res.status(500).json({ message: "Couldn't save Text File. err: " + err });
  });
});



router.put("", checkAuth, (req, res, next) => {
  xmlFileName = req.body.XmlfileName;
  editor = req.userData.email;
  const user_xml_dir = './backend/images/' + editor + '/';
  var fs = require('fs');
  let dir = user_xml_dir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  var json = req.body.json;

  // console.log("converting this json "+js2xmlparser.parse("page",json));
  var formattedXml = js2xmlparser.parse("page",json).split("\n");


  formattedXml.splice(1, 1);
  formattedXml.splice(-1, 1);
  // console.log(formattedXml.join("\n"));
   // var formattedXml = format(js2xmlparser.parse("page",json), {
  //   indentation: '  ',
  //   filter: (node) => node.type !== 'Comment',
  //   collapseContent: true,
  //   lineSeparator: '\n'
  // });

  // console.log(formattedXml);

  let writeStream = fs.createWriteStream(dir + xmlFileName);
  writeStream.on('error', (err) => {
    console.log(err);
    writeStream.end();
    res.status(500).json({
      message: "Couldn't save Text File. err: " + err
    });
  });
  writeStream.write(formattedXml.join("\n"));

  writeStream.on('finish', () => {
    console.log("imageFileName-----" + xmlFileName);
    res.status(200).json({ message: "XML File saved successfully!"});
  });
  writeStream.end();
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


module.exports = router;
