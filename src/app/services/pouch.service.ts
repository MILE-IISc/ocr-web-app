import { Injectable, NgZone, OnInit } from '@angular/core';
import PouchDB from 'node_modules/pouchdb';
import { AuthService } from '../auth/auth.service';

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

  async createRemoteDbInstance(_dbUrl, _couchDbName, _couchDbKey, _couchDbPwd) {
    console.log("_couchDbKey",_couchDbKey,"_couchDbPwd",_couchDbPwd,"couchBaseUrl",_dbUrl,"_couchDbName",_couchDbName);
    // '4c43dd2b-f41e-41ba-af80-88696a524541-bluemix.cloudantnosqldb.appdomain.cloud';
    let res = encodeURIComponent(_couchDbKey);
    this.couchDbUrl = `${_dbUrl}/${_couchDbName}`;
    this.remoteDbInstance = new PouchDB(this.couchDbUrl, { revs_limit: 1, auto_compaction: true, skip_setup: true, adapter: 'http' });
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
}
