const authChecker = require("../middleware/auth-checker");
const User = require("../models/user");
const express = require("express");
const router = express.Router();
var path = require('path');

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
    let fetchedUser;
    let myObj;
    let folderName = req.body.folderName;
    User.findOne({ email: req.body.user })
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    message: "Auth failed"
                });
            }
            fetchedUser = user;
        }).then(() => {
            User.findOneAndUpdate({ email: fetchedUser.email }, { $addToSet: { folderName: folderName } }, { new: true })
                .then(result => {
                    if (result.folderName) {
                        res.status(200).json({
                            message: "Folder updated successfully",
                        });
                    } else {
                        res.status(200).json({ message: "Updation failed" });
                    }
                })
                .catch(error => {
                    res.status(500).json({
                        message: "User folderName update failed !!!"
                    });
                });
        });
});



router.get("", (req, res, next) => {
    const mail = req.query.user;
    let fetchedUser;
    let books = [];
    User.findOne({ email: mail })
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    message: "Auth failed"
                });
            }
            fetchedUser = user;
            if (fetchedUser.folderName.length > 0) {
                //getBucketContest --> array
                for (let i = 0; i < fetchedUser.folderName.length; i++) {
                    console.log("book name" + fetchedUser.folderName[i]);
                    // parse through that bucketcontentlist array fill the bookarray(will file name coreresponding to folders)
                    const book = {
                        folderName: fetchedUser.folderName[i]
                    };
                    books.push(book);
                }

                res.status(200).json({
                    message: "Books Available",
                    book: books
                });
            } else {
                res.status(200).json({
                    message: "No Books Are Available",
                    book: books
                });
            }

        });
});

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
            User.updateOne(
                { $pull: { "folderName": { $in: [bookName] } } }
            ).then(result => {
                        if (result.nModified == 1) {
                            res.status(200).json({
                                message: "Book deleted successfully",
                                completed :"Y"
                            });
                        } else {
                            res.status(200).json({ 
                                message: "Deletion failed",
                                completed :"N"
                             });
                        }
                    })
                    .catch(error => {
                        res.status(500).json({
                            message: "folderName update failed !!!"
                        });
                });
       

});

module.exports = router;