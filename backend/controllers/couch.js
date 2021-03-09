var Cloudant = require('@cloudant/cloudant');
var couchDbAdminUrl = "https://" + process.env.COUCH_DB_ADMIN_USERNAME + ":" + process.env.COUCH_DB_ADMIN_PASSWORD + "@" + process.env.COUCH_DB_HOST;
var cloudant = new Cloudant({ url: couchDbAdminUrl });

// Authenticate User
module.exports.authenticateUser = async function (username, password) {
  return new Promise((resolve, reject) => {
    var cloudant1 = new Cloudant({ url: couchDbAdminUrl });
    cloudant1.auth(username, password, (err, response) => {
      if(err) {
        if(err.statusCode == 401) {
          console.log("authentication failed for reason",err.reason, "with statusCode:",err.statusCode);
        } else {
          console.log("authentication issue for reason",err.reason, "with statusCode:",err.statusCode);
        }
        console.log("calling resolve");
        resolve(false);
      } else {
        if((response.ok == true) && (username == response.name)) {
          console.log("authentication successfull response", response);
          resolve(true);
        } else {
          console.log("authentication failed response", response);
          resolve(false);
        }
      }
    });
  })
}

// Check Database Existence
module.exports.checkDatabase = async function (dbName) {
  return new Promise((resolve, reject) => {
    console.log("inside checkDatabase function");
    cloudant.db.get(dbName, (err, response) => {
      if (err) {
        if (err.statusCode == 404) { // db does not exists error -> { error: 'not_found', reason: 'Database does not exist.', statusCode: 404 }
          console.log("database does not exists, statusCode:", err.statusCode, "error key", err.error);
          resolve(false);
        } else {
          console.log("error on creation of database", err.statusCode, "error key", err.error);
          resolve(false);
        }
      } else {
        console.log("got response on check database function");
        resolve(true);
      }
    });
  });
}


// Create Database per User
module.exports.createDatabase = async function (dbName) {
  return new Promise((resolve, reject) => {
    cloudant.db.create(dbName, { revs_limit: 1, auto_compaction: true, skip_setup: true }, (err, response) => { // db created successful -> response: { ok: true }
      if (err) {
        if (err.statusCode == 412) { // db already exists error -> err: { statusCode: 412, error: file_exists, .... }
          console.log("error on creation of database", err.statusCode, "error key", err.error);
          resolve(true);
        } else {
          console.log("error on creation of database", err.statusCode, "error key", err.error);
          resolve(false);
        }
      } else {
        console.log("response of creation of database", response);
        resolve(true);
      }
    });
  });
  // return cloudant.use(dbName).insert({ bookId: "", bookName: "", bookThumbnail: "" });
}


// setting security for users database
module.exports.getDbSecurity = async function (dbName) {
  return new Promise((resolve, reject) => {
    var db = dbName;
    var database = cloudant.db.use(db);
    var security = {};
    database.get_security(async function (err, result) {
      if (err) {
        // throw er;
        console.log("error while getting permission for database", err);
        resolve(false);
      }
      console.log('Got security for ' + db);
      // console.log(result);
      console.log("before if result.cloudant");
      if (result.cloudant && Object.keys(result.cloudant).length > 0) {
        var promiseArray = [];
        console.log("inside if result.cloudant");
        console.log("no. of permissions granted for this db", Object.keys(result.cloudant).length);
        for (let key in result.cloudant) {
          promiseArray.push(new Promise((resolve, reject) => {
            console.log("key:", key, "value:", result.cloudant[key]);
            if (key != "nobody") {
              security[key] = result.cloudant[key];
            }
            resolve(true);
          }))
        }
        await Promise.all(promiseArray);
        resolve(security);
      } else {
        console.log("There were no permissions granted for this db");
        resolve(security);
      }
    });
  });
}

module.exports.setDbSecurity = async function (dbName, securityInfo) {
  return new Promise(async (resolve, reject) => {
    var database = cloudant.db.use(dbName);
    var security = {};
    var apiKeyValuePair = {};
    if (Object.keys(securityInfo).length == 1) {
      security = securityInfo;
      securityKeyArray = Object.keys(securityInfo);
      apiKeyValuePair.key = securityKeyArray[0];
      apiKeyValuePair.password = "";
      console.log("apiKeyValuePair.key", apiKeyValuePair.key, "apiKeyValuePair.value", apiKeyValuePair.password);
    } else {
      await generateApiKey().then((apiKeyValue) => {
        console.log("got response from  generate api key function");
        // Setting security for database
        security[apiKeyValue.key] = ['_admin', '_replicator', '_reader', '_writer'];
        apiKeyValuePair = apiKeyValue;
      }).catch((err) => {
        console.log("error while generating api key", err);
      });
    }
    database.set_security(security, function (err, result) {
      if (err) {
        // throw er;
        console.log("error while setting permission for userdb", err);
        resolve(false);
      }
      console.log('Set security for', dbName, "with key", apiKeyValuePair.key, "with password", apiKeyValuePair.password);
      console.log(result);
      let access = { "key": apiKeyValuePair.key, "password": apiKeyValuePair.password };
      resolve(access);
    });
  });
}

module.exports.copyDbSecurity = async function (dbName, securityInfo) {
  return new Promise(async (resolve, reject) => {
    var database = cloudant.db.use(dbName);
    var security = {};
    var apiKeyValue = {};
    if (Object.keys(securityInfo).length == 1) {
      security = securityInfo;
      securityKeyArray = Object.keys(securityInfo);
      apiKeyValue.key = securityKeyArray[0];
      apiKeyValue.password = "";
      console.log("apiKeyValue.key", apiKeyValue.key, "apiKeyValue.password", apiKeyValue.password);
    } else {
      console.log("no permissions are available to set");
      resolve(false);
    }
    database.set_security(security, function (err, result) {
      if (err) {
        // throw er;
        console.log("error while setting permission for userdb", err);
        resolve(false);
      }
      console.log('Set security for', dbName, "with key", apiKeyValue.key, "with password", apiKeyValue.password);
      console.log(result);
      let access = { "key": apiKeyValue.key, "password": apiKeyValue.password };
      resolve(access);
    });
  });
}

// Generate API_KEY before setting permission as this functionality only provides password which can be used iun the front-end
async function generateApiKey() {
  return new Promise((resolve, reject) => {
    console.log("inside generate api key function");
    cloudant.generate_api_key(function (err, api) {
      if (err) {
        throw err; // You probably want wiser behavior than this.
      }

      console.log('API key: %s', api.key);
      console.log('Password for this key: %s', api.password);
      let access = { "key": api.key, "password": api.password };
      resolve(access);
    });
  });

  // var Cloudant = require('@cloudant/cloudant');
  // var cloudant = Cloudant({ account:"me", key:api.key, password:api.password });
}


// get all documents from a database
module.exports.getAllDocsMetaData = async function (dbName) {
  return new Promise((resolve, reject) => {
    var db = cloudant.use(dbName);
    db.list(function (err, data) {
      if(err) {
        resolve(err);
      }
      console.log("got all docsMetaData from database",dbName);
      resolve(data);
    });
  });
}

// Find User
module.exports.findUser = async function (dbName, searchValue) {
  return new Promise((resolve, reject) => {
    var db = cloudant.use(dbName);
    // dbSearchKey = `"` + searchKey + `"`;
    console.log("serach in findDocument", searchValue);
    db.find({
      'selector': {
        name: {
          '$eq': searchValue
        }
      }
    }).then((documents) => {
      // if (err) {
      // } else {
      console.log("documents", documents.docs.length);
      // console.log("docs retrieved for email", documents.docs);
      resolve({ documents, statusCode: (documents.docs.length > 0) ? 200 : 404 });
      // }
    }).catch((err) => {
      console.log("error while logging from cloudant", err);
      reject(err);
    });
  });
}

// Find Book
module.exports.findBook = async function (dbName, searchValue) {
  return new Promise((resolve, reject) => {
    var db = cloudant.use(dbName);
    // dbSearchKey = `"` + searchKey + `"`;
    console.log("search in findDocument", searchValue);
    db.find({
      'selector': {
        bookName: {
          '$eq': searchValue
        }
      }
    }).then((documents) => {
      console.log("documents", documents.docs.length);
      resolve({ documents, statusCode: (documents.docs.length > 0) ? 200 : 404 });
    }).catch((err) => {
      console.log("error while logging from cloudant", err);
      reject(err);
    });
  });
}

// Find Page
module.exports.findPage = async function (dbName, searchValue) {
  return new Promise((resolve, reject) => {
    var db = cloudant.use(dbName);
    // dbSearchKey = `"` + searchKey + `"`;
    console.log("search in findBook", searchValue);
    db.find({
      'selector': {
        pageName: {
          '$eq': searchValue
        }
      }
    }).then((documents) => {
      console.log("documents", documents.docs.length);
      resolve({ documents, statusCode: (documents.docs.length > 0) ? 200 : 404 });
    }).catch((err) => {
      console.log("error while logging from cloudant", err);
      reject(err);
    });
  });
}

// Insert Document into Database
module.exports.insertDocument = async function (dbName, document) {
  return new Promise((resolve, reject) => {
    var db = cloudant.use(dbName);
    db.insert(document).then((result) => {
      // console.log("result", result);
      resolve(result);
    });
  });
}

// Insert Document into Database
module.exports.deleteDocument = async function (dbName, documentId) {
  return new Promise((resolve, reject) => {
    var db = cloudant.use(dbName);
    db.remove(documentId).then((result) => {
      console.log("result", result);
      resolve(result);
    }).catch(err => {
      console.log("error while delete in couch.js",err);
    })
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
