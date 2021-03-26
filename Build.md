# Build and deploy OCR Web App as Docker Container

## 1. To setup object store
Images required for OCR web app is stored in object store. It can either be setup locally using MinIO or in IBM COS in IBM cloud
And data is stored in Apache CouchDB when setup is done locally and in IBM cloudant in IBM cloud

To setup Minio and Apache CouchDB on your local environment follow instructions in [Setup_MinIO_ApacheCouchDB.md](Setup_MinIO_ApacheCouchDB.md)

## 2. Setup OCR Engine
To setup OCR engine, follow instructions [here](https://github.com/MILE-IISc/MILE-OCR-Engine/blob/master/Build.md)

## 3. Build docker image

Trigger build using `docker build` command
```
$ docker build -t ocr-web-app .
```

This will take some time to complete, and you would see output as shown below:
```
$ docker build -t ocr-web-app .
Sending build context to Docker daemon  105.8MB
Step 1/20 : FROM node:14.15.3 AS compile-image
...
Step 2/20 : WORKDIR /opt/ng
...
Step 3/20 : COPY package.json angular.json tsconfig.app.json tsconfig.base.json tsconfig.json tsconfig.spec.json tslint.json ./
...
Step 4/20 : COPY src ./src
...
Step 5/20 : COPY backend ./backend
...
Step 6/20 : RUN npm install
...
Step 7/20 : RUN npm install -g @angular/cli@10.0.8
...
Step 8/20 : RUN ng build --prod
...
Step 9/20 : COPY README.md ./
...
Step 10/20 : RUN npm install -g marked
...
Step 11/20 : RUN marked -o backend/OCR-WEB-UI/help.html README.md
...
Step 12/20 : COPY docs ./backend/OCR-WEB-UI/docs
...
Step 13/20 : FROM node:14.15.3-alpine3.11
...
Step 14/20 : COPY --from=compile-image /opt/ng/backend /app
...
Step 15/20 : RUN cd /app; npm install
...
Step 16/20 : ENV NODE_ENV production
...
Step 17/20 : ENV PORT 8080
...
Step 18/20 : EXPOSE 8080
...
Step 19/20 : WORKDIR /app
...
Step 20/20 : CMD [ "npm", "start" ]
...
Successfully built a524b6a5b9f5
Successfully tagged ocr-web-app:latest
```

Test that the docker image is created successfully by running `docker images` command. You should see the `ocr-web-app` image that we just built.
```
$ docker images
REPOSITORY                           TAG                                              IMAGE ID            CREATED             SIZE
ocr-web-app                          latest                                           a524b6a5b9f5        2 hours ago         197MB
node                                 14.15.3                                          72aaced1868f        5 weeks ago         942MB
node                                 14.15.3-alpine3.11                               51d926a5599d        5 weeks ago         116MB

```

## 4. Set environment variables

Create a text file by name `ocr-web-app.env` containing the information needed to connect to the other needed services: CouchDB, Object Storage and OCR Engine.
```
JWT_KEY=<jwt-secret-key>
OBJECT_STORAGE_ENDPOINT=s3.ap.cloud-object-storage.appdomain.cloud
OBJECT_STORAGE_ACCESS_KEY_ID=<object_storage_access_key_id>
OBJECT_STORAGE_SECRET_ACCESS_KEY=<object_storage_secret_access_key>
COUCH_DB_HOST=<couch_db_hostname_port>
COUCH_DB_ADMIN_USERNAME=<couch_db_admin_username>
COUCH_DB_ADMIN_PASSWORD=<couch_db_admin_password>
COUCH_DB_PROVIDER=IBM_CLOUDANT
RUN_OCR_ADDRESS=http://<ip-address-of-OCR-REST-API>:9080/
RUN_OCR_PORT=9080
```
Example:
```
$ cat .\ocr-web-app.env
JWT_KEY=somesecret
OBJECT_STORAGE_ENDPOINT=http://192.168.0.52:9000
OBJECT_STORAGE_ACCESS_KEY_ID=admin
OBJECT_STORAGE_SECRET_ACCESS_KEY=admin123
COUCH_DB_HOST=192.168.0.52:5984
COUCH_DB_ADMIN_USERNAME=admin
COUCH_DB_ADMIN_PASSWORD=admin123
COUCH_DB_PROVIDER=APACHE_COUCHDB
RUN_OCR_ADDRESS=http://192.168.0.52:9080/
RUN_OCR_PORT=9080
```

## 5. Run the docker

Start the `OCR Web App` using `docker run` command:
```
$ docker run -p 8080:8080 --env-file ocr-web-app.env --name iisc-ocr-web-app -d ocr-web-app
```

Verify that the docker started and is in `Up` status by running `docker ps` command.
```
$ docker ps -a
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                    PORTS                    NAMES
ac6c63d9cd06        ocr-web-app         "docker-entrypoint.s…"   10 seconds ago      Up 8 seconds              0.0.0.0:8080->8080/tcp   iisc-ocr-web-app
```

## 6. Launch OCR Web App

Open http://localhost:8080/ in your browser.

# Troubleshooting

1. See logs of `Node.js` backend:

```
$ docker logs iisc-ocr-web-app
```

2. See logs of `Angular` frontend code

  Press Ctrl+Shift+I (on Chrome/Firefix) to open `Developer tools` and click on `Console`

# References
1. [Download and install Docker](https://docs.docker.com/get-docker/)
2. [How do I get into a Docker container's shell?](https://stackoverflow.com/questions/30172605/how-do-i-get-into-a-docker-containers-shell)
3. [How To Run Commands In Stopped Docker Containers](https://thorsten-hans.com/how-to-run-commands-in-stopped-docker-containers)
