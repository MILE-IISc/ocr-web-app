const express = require("express");
const fs = require("fs");
var path = require('path');
const router = express.Router();
const { promise } = require("protractor");
var xml2js = require('xml2js');
var JSZip = require('jszip');
var request = require("request");
const authChecker = require("../middleware/auth-checker");
const couch = require("../controllers/couch");


function getXmlConvertToAltoAndAddToZip(bookDbName, fileName, folder) {
  return new Promise(async (resolve, reject) => {
    await couch.findPage(bookDbName, fileName).then(async (response) => {
      if (response.statusCode == 404) {
        console.log("Document not available in Couch for",fileName);
        resolve(false);
      } else {
        console.log("Got Output from find document for pageName", fileName, "in", bookDbName, "no. of documents", response.documents.docs.length);
        if(response.documents.docs.length == 1) {
          pageDocument = response.documents.docs[0];
          xmlJsonObject = pageDocument.data;
          const builder = new xml2js.Builder();
          xmlContent = await builder.buildObject(xmlJsonObject);
          if (xmlContent != null) {
            console.log(`Fetched XML: ${fileName} from CouchDb. Converting it to ALTO XML ...`);
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
        }
      }
    });
  });
}

router.get("", authChecker, async (req, res, next) => {
  bucketName = req.userData.bucketName;
  const bookDbName = req.query.bookDbName;
  const bookName = req.query.bookName;
  const xmlFilesList = [];
  console.log("bookDbName from downloadXml",bookDbName);
  // couchDb code starts here
  await couch.getAllDocsMetaData(bookDbName).then(async (result) => {
    console.log("got all docsMetada for ",bookDbName);
    if(result.rows.length > 0) {
      for(i = 0; i < result.rows.length; i++) {
        console.log("document for ",i,":",result.rows[i].id);
        fileName = result.rows[i].id;
        if(path.extname(fileName).toLowerCase() == ".xml") {
          xmlFilesList.push(fileName);
        }
      }
    }
  });
  // couchDb code ends here
  console.log(`Count of XML files = `, xmlFilesList.length);

  var zip = new JSZip();
  var folder = zip.folder(bookName + "_xml_files");

  var n = xmlFilesList.length;
  function processXml(i, cb) {
    getXmlConvertToAltoAndAddToZip(bookDbName, xmlFilesList[i - 1], folder).then((data) => {
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
    var zipFileName = bookName + '_xml_files.zip';
    zip
      .generateNodeStream({ streamFiles: true })
      .pipe(fs.createWriteStream(zipFileName))
      .on('finish', async function () {
        console.log("Sending ZIP of XML files {zipFileName}");
        // res.setHeader('Content-disposition', 'attachment; filename=out.zip');
        // res.sendFile(zipFileName);
        res.download(zipFileName, function(err) {
          if(err) {
            console.log("err while sending download response",err);
          }
          deleteZipFile(zipFileName).then((status) => {
            console.log("deleted Zip file", zipFileName, "with status", status);
          });
        });
      })
  };
  processXml(1, createZip);
});

async function deleteZipFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlinkSync(filePath, function (err) {
      if (err && err.code == 'ENOENT') {
        // file doens't exist
        console.log("File doesn't exist, won't remove it.");
        resolve(false);
      } else if (err) {
        // other errors, e.g. maybe we don't have enough permission
        console.log("Error occurred while trying to remove file");
        resolve(false);
      } else {
        console.log(`unknown error`, err);
        resolve(false);
      }
    });
    console.log(filePath, "deleted successfully");
    resolve(true);
  });
}

module.exports = router;
