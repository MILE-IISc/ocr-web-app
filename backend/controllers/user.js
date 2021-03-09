const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var crypto = require('crypto');

const User = require("../models/user");
const couch = require("./couch");

// User Login
exports.userLogin = async (req, res, next) => {
  console.log("Calling Cloudant findUser function");
  let userInfo;
  await couch.findUser("_users",req.body.email).then(async (response) => {
    console.log("Got Output from Cloudant findUser function on Login");
    if (response.statusCode == 404) {
      console.log("User not found. Sending 404 response");
      return res.status(401).json({
        message: "Invalid credentials"
      });
    } else {
      console.log("User record count in Cloudant authdb", response.documents.docs.length);
      // console.log("User found in Cloudant authdb", response.documents.docs);
      if (response.documents.docs.length == 1) {
        userInfo = response.documents.docs[0];
        console.log("User found in Cloudant authdb", userInfo);
        saltedPassword = req.body.password + userInfo.salt;

        var cryptoHash = await crypto.createHash('sha1').update(saltedPassword).digest('hex');
        console.log("req.body.password",req.body.password);
        console.log("userInfo.salt",userInfo.salt);
        console.log("saltedPassword",saltedPassword);
        console.log("cryptoHash", cryptoHash); // 9b74c9897bac770ffc029102a200c5de
        console.log("userInfo.password_sha: of CouchDb _user db:", userInfo.password_sha);
        if(cryptoHash == userInfo.password_sha) {
          const token = jwt.sign(
            { email: userInfo.name, userId: userInfo.userId },
            process.env.JWT_KEY,
            { expiresIn: "365d" }
          );
          perUserDb = "mile_user_db_" + userInfo.userId;
          console.log("checking db existence for",perUserDb);
          couch.checkDatabase(perUserDb).then(async (dbStatus) => {
            console.log("checked Database existence", dbStatus);
            if(!dbStatus) {
              console.log("creating db for user", perUserDb);
              dbCreationStatus = await couch.createDatabase(perUserDb).then(status => {
                console.log("database creation successful", status);
                return status;
              }).catch((err) => {
                console.log(err);
              });
            }
              securityInfo = {};
              securityInfo[userInfo.name] = ['_admin', '_replicator', '_reader', '_writer'];
              couch.setDbSecurity(perUserDb, securityInfo).then(async (access) => {
                console.log("permission granted successfully for userdb", access.key, "password",access.password);
                await couch.getAllDocsMetaData(perUserDb).then(async (result) => {
                  console.log("got all docsMetada for ",perUserDb);
                  if(result.rows.length > 0) {
                    for(i = 0; i < result.rows.length; i++) {
                      console.log("documentId for ",i,":",result.rows[i].id);
                      bookDb = "mile_book_db_"+result.rows[i].id;
                      securityInfo = {};
                      securityInfo[access.key] = ['_admin', '_replicator', '_reader', '_writer'];
                      await couch.copyDbSecurity(bookDb, securityInfo).then((access) => {
                        console.log("granted permission for",bookDb,"to key",access.key);
                      });
                    }
                  }
                });
                const token = jwt.sign(
                  { email: userInfo.email, userId: userInfo._id },
                  process.env.JWT_KEY,
                  { expiresIn: "365d" }
                );
                console.log("Sending login successful response");
                res.status(200).json({
                  token: token,
                  expiresIn: 31536000,
                  userId: userInfo.userId,
                  email: userInfo.name,
                  role: userInfo.roles[0],
                  bucketName: userInfo.bucketName,
                  dbUrl: process.env.COUCH_DB_HOST,
                  userDb: perUserDb,
                  userDbKey: userInfo.name,
                  userDbPwd: req.body.password
                });
              }).catch((err) => {
                console.log("error while granting permission for userdb", err);
              });
          });
        } else {
          console.log("Password Mismatch. Sending 401 response");
          return res.status(401).json({
            message: "Invalid credentials"
          });
        }
      }
    }
  }).catch(err => {
    console.log("error while logging in", err);
    return res.status(401).json({
      message: "Invalid credentials"
    });
  });
}

// User Creation
exports.createUser = async (req, res, next) => {
  await couch.findUser("authdb",req.body.email).then(async (response) => {
    console.log("Got Output from Cloudant find function on createUser");
    if (response.statusCode == 404) {
      console.log("User not found");
      var cryptoUserIdHash = await crypto.createHash('sha1').update(req.body.email).digest('hex');
      console.log("cryptoUserIdHash",cryptoUserIdHash); // 9b74c9897bac770ffc029102a200c5de
      crypto.createHash('sha256').update(req.body.password).digest('hex').then(hash => {
        const clouadnt_user = {
          _id: "org.couchdb.user:"+req.body.email,
          userId: cryptoUserIdHash,
          name: req.body.email,
          password: hash,
          role: req.body.role,
          bucketName: ''
        }
        couch.insertDocument('_users',clouadnt_user).then((result) => {
          // console.log("result", result);
          res.status(201).json({
            message: "User created!",
            result: result
          });
        });
      });
    } else {
      console.log("Please use different mail id as it already exists in Cloudant user db", response.data);
      res.status(500).json({
        message: "User Id already exists. Please use different Id"
      });
    }
  });
}
