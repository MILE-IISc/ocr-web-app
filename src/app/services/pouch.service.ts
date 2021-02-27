import { Injectable, NgZone, OnInit } from '@angular/core';
import PouchDB from 'node_modules/pouchdb';

@Injectable()
export class PouchService implements OnInit {

  couchBaseUrl: any;
  couchDbName: any;
  couchDbUrl: any;
  couchDbKey: any;
  couchDbPwd: any;
  pouchDbInstance: any;
  remoteDbInstance: any;

  data: any;

  constructor(public zone: NgZone) { }

  ngOnInit(): void { }

  async createPouchDbInstance(_couchDbName) {
    this.pouchDbInstance = await new PouchDB(_couchDbName, { revs_limit: 1, auto_compaction: true, skip_setup: true });
    return this.pouchDbInstance;
  }

  async createRemoteDbInstance(_couchDbName, _couchDbKey, _couchDbPwd) {
    // this.pouchDbInstance = await new PouchDB(_couchDbName, { revs_limit: 1, auto_compaction: true, skip_setup: true });
    this.couchBaseUrl = '4c43dd2b-f41e-41ba-af80-88696a524541-bluemix.cloudantnosqldb.appdomain.cloud';
    this.couchDbUrl = `https://${_couchDbKey}:${_couchDbPwd}@${this.couchBaseUrl}/${_couchDbName}`;
    this.remoteDbInstance = new PouchDB(this.couchDbUrl, { revs_limit: 1, auto_compaction: true, skip_setup: true });
    return this.remoteDbInstance;
  }

  async checkDbStatus(dbInstance) {
    let status = await dbInstance.info(function (err, info) {
      if (err) {
        console.log(err);
        return false
      } else {
        // console.log("userDbInstance in authService", info);
        return true;
      }
    });
    return status;
  }
  async syncDb(_couchDbName, _couchDbKey, _couchDbPwd) {
    this.couchDbName = _couchDbName;
    this.couchBaseUrl = '4c43dd2b-f41e-41ba-af80-88696a524541-bluemix.cloudantnosqldb.appdomain.cloud';
    // this.couchDbKey = 'apikey-v2-4l1y9bf9d7fj9ed8d05okxr4959hnyvpuonvqxm16dk'; // admin key and pwd
    // this.couchDbPwd = '3bc0cc550ff29bd53d798b40cdfe97e2';
    this.couchDbKey = _couchDbKey; // generated api Key
    this.couchDbPwd = _couchDbPwd;
    this.pouchDbInstance = new PouchDB(this.couchDbName, { revs_limit: 1, auto_compaction: true, skip_setup: true });
    this.couchDbUrl = `https://${this.couchDbKey}:${this.couchDbPwd}@${this.couchBaseUrl}/${this.couchDbName}`;
    console.log("this.remote", this.couchDbUrl);
    this.remoteDbInstance = new PouchDB(this.couchDbUrl, { skip_setup: true });

    // ,
    //   auth: {
    //     username: this.userDbKey,
    //     password: this.userDbPwd
    //   }

    let options = {
      live: true,
      retry: true,
      continuous: true
    };
    // this.savePouchDbForm();
    this.pouchDbInstance.sync(this.remoteDbInstance, options).then(() => {
      console.log("synchronization started in pouchService for db",_couchDbName);
    });

    // getting all docs in list
    // let ocrBookDb = new PouchDB("mile_book_db_6f7f1662775d73830a5ebba485c14a53");
    this.pouchDbInstance.allDocs().then(async (result) => {
      console.log("result.rows.length", result.rows.length);
      for (let i = 0; i < result.rows.length; i++) {
        console.log("id of doc " + i, result.rows[i].id);
        // console.log("complete doc "+i,result.rows[i]);
        this.pouchDbInstance.get(result.rows[i].id).then(function (doc) {
          console.log("retrieved document from mile_book_db_6f7f1662775d73830a5ebba485c14a53", doc);
        }).catch(function (err) {
          console.log("error status", err.status);
          if (err.status == "404") {
            return "NOT_FOUND";
          }
        });
      }
    });
    // return;
  }


  async savePouchDbForm() {
    var imageform = {
      _id: "isakbkajsdjkans128971!@$%@&*(s@gmail.com",
      name: "isas@gmail.com",
    }
    // this.db = new PouchDB("MILE_OCR_WorkDir", {auto_compaction: true});
    this.pouchDbInstance.put(imageform).then((result, error) => {
      console.log("result", result);
      console.log("error", error);
      if (!error) {
        console.log("Pouch form saved successfully");
      }
      return true;
    });
  }

}
