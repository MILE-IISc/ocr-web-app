# 1. Setup MinIO

```
$ docker run -dp 9000:9000 -e "MINIO_ROOT_USER=<minio_admin_username>" -e "MINIO_ROOT_PASSWORD=<minio_admin_password>" --name iisc-minio-s3-bucket minio/minio server /minioS3bucket
```


## a) UI Interface for MinIO:
 - Open http://localhost:9000 in your browser.
 - Login using the `<minio_admin_username>` & `<minio_admin_password>` which  and then create a bucket using the UI interface. And this bucket name will be used in configuring user_info in couch db (in step 2c)


# 2. Setup Apache CouchDB

```
$ docker run -d -p 5984:5984 -e COUCHDB_USER=<couchdb_admin_username> -e COUCHDB_PASSWORD=<couchdb_admin_password> --name my-couchdb couchdb:3
```
## a) To enable cors to couchDb running in docker container
  ```
$ npm i -D add-cors-to-couchdb
$(npm bin)/add-cors-to-couchdb http://<local_ip_address>:5984 -u <admin_username> -p <admin_password>
```

## b) UI Interface for couchDb:
 - Open http://localhost:5984/_utils/index.html#login in your browser. And login using the `<couchdb_admin_username>` & `<couchdb_admin_password>`

## c) Create ocr-web-app login id
 - Now we have to create `"_users"` database and insert a user document in that database using UI interface or using the commands below,
  ```
$ curl -v -X PUT "http://<admin_username>:<admin_password>@<local_ip_address>:5984/_users"

$ curl -v -X PUT "http://<admin_username>:<admin_password>@<local_ip_address>:5984/_users" --data-binary '{"_id": "org.couchdb.user:<ocr_login_id>","name": "<ocr_login_id>","roles": ["admin"],"type": "user","password":"<ocr_login_password>","bucketName":"<bucketName>","userId": "<userId>"}'
```

## d) Assign `APACHE_COUCHDB` to the environment variable `COUCH_DB_PROVIDER`  as we are using couchDb. If we are using IBM Cloudant set it as  `IBM_CLOUDANT`


After successful completion, configure the environment variables in `ocr-web-app.env` file which will be used while invoking ocr-web-app
