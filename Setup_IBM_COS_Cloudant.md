
# A) Setup IBM Cloud Object Storage

 - Create User Id & Login to [IBM Cloud Services](https://cloud.ibm.com/login)

 - Type `Object Storage` inside the Search Bar and choose `Object Storage` from the drop-down list

 - Once you have chosen, the Cloud Object Storage plans will be displayed and by default `Lite` plan would be checkmarked and then click `Create`

 - You can change the Service name or use the default name provided and then click `Create`

 - Now you will be redirected to the  Cloud Object Storage Instance page. Choose `Service credentials` and click `New credential`

 - Expand Advanced options in the Create credential dialog box. Choose the role as `Manager` and check `Include HMAC Credential` and then click `Add`

 - Expand the newly created Service credential entry. Use access_key_id & secret_access_key to set `OBJECT_STORAGE_ACCESS_KEY_ID` & `OBJECT_STORAGE_SECRET_ACCESS_KEY` environment variables respectively which will be used while invoking ocr-web-app

 - Click Buckets and then click `Create bucket` and then choose "Cuztomize your bucket". Use unique bucket name as per the rules mentioned. You can choose resiliency & location as per your need. And then click `Create bucket`. And this bucket name will be used in configuring user_info in couch db (in step B12)

 - Now click `Endpoints` and choose the location and resiliency used while creating bucket. Now you can choose the endpoint url from the populated list and set `OBJECT_STORAGE_ENDPOINT` environment variable.


# B) Setup IBM Cloudant

 - Type `Cloudant` inside the Search Bar and choose `Cloudant` from the drop-down list

 - By default Environment will be "Multitenant". Choose any region from the Available regions as per your preference. 
 
  - You can change the Instance name or use the default name provided and then choose `IAM and legacy credentials` as Authentication method.
 
  - By default, `Lite` plan would be checkmarked and then click `Create`

  - Once the Cloudant status changes from "Provision In Progress" to "Active". Click the Cloudant Instance which will be displayed under "Services" and you will be redirected to the  Cloudant Instance page.

 - You can change the Service name or use the default name provided and then click `Create`

 - Now you will be redirected to the  Cloud Object Storage Instance page. Choose `Service credentials` and click `New credential`

 - Expand Advanced options in the Create credential dialog box. Choose the role as `Manager` and then click `Add`

 - Expand the newly created Service credential entry. Use host, username & password to set `COUCH_DB_HOST`, `COUCH_DB_ADMIN_USERNAME` &  `COUCH_DB_ADMIN_PASSWORD` environment variables respectively. Also we have to set  `IBM_CLOUDANT` as "COUCH_DB_PROVIDER" in environment as we are using IBM Cloud services(Cloudant)
 
 - Click `Manage` and on clicking `Launch Dashboard`, you will redirected Cloudant database & settings dashboard page.

 - Click Account(displayed with head icon) and then Click `CORS`. If CORS is disabled, click `Enable CORS` and check mark `All domains ( * )` to avoid CORS policy issue.

 - Now we have to create `"_users"` database and insert a user document in that database using UI interface or using the credentials(in step B9) and using the commands below,
 
    ```
      $ curl -v -X PUT "https://<username>:<password>@<host>/_users"
      $ export OCR_USER_NAME=<user_login_id> #should be of the form user@domain.com (ex:ocr@gmail.com)
      $ curl -v -X POST -H 'Content-Type: application/json' "https://<username>:<password>@<host>/_users" --data-binary '{"_id": "org.couchdb.user:'$OCR_USER_NAME'","name": "'$OCR_USER_NAME'","roles": ["admin"],"type": "user","password":"<ocr_login_password>","bucketName":"<bucketName>","userId": "'$(echo $OCR_USER_NAME|sha1sum|awk '{print $1}')'"}'
     ```

 ## After successful completion, assign `IBM_CLOUDANT` to the environment variable `COUCH_DB_PROVIDER` as we are using IBM Cloudant. If we are using CouchDb set it as `APACHE_COUCHDB` which will be used while invoking ocr-web-app
