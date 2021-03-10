const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var crypto = require('crypto');

const couch = require("./couch");

// User Login
exports.userLogin = async (req, res, next) => {
  console.log("Calling Cloudant findUser function");
  userName = req.body.email;
  password = req.body.password;
  let userInfo;
  await couch.authenticateUser(userName, password).then(async (status) => {
    if(status == true) {
      console.log("CouchDb Authentication successful");
      await couch.findUser("_users",userName).then(async (response) => {
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
                      userDbPwd: password
                    });
                  }).catch((err) => {
                    console.log("error while granting permission for userdb", err);
                  });
              });
          }
        }
      });
    } else {
      console.log("CouchDb Authentication failed");
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }
  }).catch(err => {
    console.log("error while authenticating user");
    return res.status(401).json({
      message: "Invalid credentials"
    });
  });
}

// User Creation
exports.createUser = async (req, res, next) => {
  await couch.findUser("_users",req.body.email).then(async (response) => {
    console.log("Got Output from Cloudant find function on createUser");
    if (response.statusCode == 404) {
      console.log("User not found");
      var id = "org.couchdb.user:"+req.body.email;
      var userIdHash = await crypto.createHash('sha1').update(req.body.email).digest('hex');
      var userRoles = [];
      userRoles.push(req.body.role);
      const clouadnt_user = {
        _id: id,
        userId: userIdHash,
        name: req.body.email,
        password: req.body.password,
        roles: userRoles,
        bucketName: '',
        password_scheme: 'simple',
        type: "user"
      }
      couch.insertDocument('_users',clouadnt_user).then((status) => {
        if (status == true) {
          res.status(201).json({
            message: "User created!"
          });
        } else {
          res.status(500).json({
            message: "Unable to create user"
          });
        }
      });
    } else {
      console.log("Please use different mail id as it already exists");
      res.status(500).json({
        message: "User Id already exists. Please use different Id"
      });
    }
  });
}
