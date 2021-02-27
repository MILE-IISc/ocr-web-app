const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const couch = require("./couch");

// User Login
exports.userLogin = async (req, res, next) => {
  console.log("Calling Cloudant findUser function");
  let userInfo;
  // findUserById(req.body.email)
  await couch.findUser("authdb",req.body.email).then(async (response) => {
    console.log("Got Output from Cloudant findUser function on Login");
    if (response.statusCode == 404) {
      console.log("User not found. Sending 404 response");
      return res.status(401).json({
        message: "Invalid credentials"
      });
    } else {
      console.log("User found in Cloudant authdb", response.documents.docs);
      if (response.documents.docs.length == 1) {
        userInfo = response.documents.docs[0];
        authStatus = await bcrypt.compare(req.body.password, userInfo.password);
        if (authStatus) {
          perUserDb = "mile_user_db_" + userInfo._id;
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
            // couch.getDbSecurity(perUserDb).then((dbSecurity) => {
              securityInfo = {};
            //   console.log("dbSecurity from userDb in user.js",dbSecurity);
            //   if(Object.keys(dbSecurity).length == 1) {
            //     securityInfo = dbSecurity;
            //   }
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
                  userId: userInfo._id,
                  email: userInfo.email,
                  role: userInfo.role,
                  bucketName: userInfo.bucketName,
                  userDb: perUserDb,
                  userDbKey: access.key,
                  userDbPwd: access.password
                });
              }).catch((err) => {
                console.log("error while granting permission for userdb", err);
              });
            // }).catch((err) => {
            //   console.log("error while getting permission for userdb", err);
            // });
          });
        } else {
          console.log("Password Mismatch. Sending 401 response");
          return res.status(401).json({
            message: "Invalid credentials"
          });
        }
      } else {
        console.log("Multiple users found. Sending 409 response");
        return res.status(409).json({
          message: "Invalid credentials - Multiple users found"
        });
      }
    }
  }).then()
    .catch(err => {
      console.log("error while logging in", err);
      return res.status(401).json({
        message: "Invalid credentials"
      });
    });
}

// User Creation
exports.createUser = async (req, res, next) => {
  await couch.findUser("authdb",req.body.email).then((response) => {
    console.log("Got Output from Cloudant find function on createUser");
    if (response.statusCode == 404) {
      console.log("User not found");
      bcrypt.hash(req.body.password, 10).then(hash => {
        const clouadnt_user = {
          email: req.body.email,
          password: hash,
          role: req.body.role,
          bucketName: '',
          booksAssigned: []
        }
        couch.insertDocument('authdb',clouadnt_user).then((result) => {
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



// Code for Learning & Reusage Purpose

// get cloudant cors details
// cloudant.get_cors(function (err, data) {
//   console.log(data);
// });

// Lists all the databases.
// cloudant.db.list(function (err, body, headers) {
//   console.log("error", err);
//   console.log("headers", headers);
//   console.log("body", body);
//   body.forEach(function (db) {
//     console.log(db);
//   });
// });

// List all Db's
// cloudant.db.list().then((body) => {
//   console.log("cloudant list initiated");
//   body.forEach((db) => {
//     console.log(db);
//   });
// }).catch((err) => { console.log(err); });


// Find User in Database using _id
// function findUserById(id) {
//   return new Promise((resolve, reject) => {
//     var db = cloudant.use('authdb');
//     db.get(id, (err, document) => {
//       if (err) {
//         if (err.message == 'missing') {
//           console.log(`Document id ${id} does not exist.`, 'findUserById()');
//           resolve({ data: {}, statusCode: 404 });
//         } else if (err.message == 'deleted') {
//           console.log('Error occurred: in findUserById' + err);
//           resolve({ data: {}, statusCode: 404 });
//         } else {
//           console.log('Error occurred: in findUserById' + err);
//           // console.log('Error occurred: ' + err.message, 'findUserById()');
//           // reject(err);
//           resolve({ data: {}, statusCode: 404 });
//         }
//       } else {
//         resolve({ data: document, statusCode: 200 });
//       }
//     });
//   });
// }


// Setting security for database sample code
// users_database.set_security(security, function (er, result) {
//   if (er) {
//     throw er;
//   }

//   console.log('Set security for ' + db);
//   console.log(result);
//   console.log('');
// });
// account: 'apikey-v2-4l1y9bf9d7fj9ed8d05okxr4959hnyvpuonvqxm16dk',
// password: '3bc0cc550ff29bd53d798b40cdfe97e2',

// plugins: {
//   iamauth: {
//     iamApiKey: 'ZDXoYS31GByt5KTZig7kl3FKVFzsDcUSaQIyrPvCFdYK'
//   }
// }
// Using the async/await style.
