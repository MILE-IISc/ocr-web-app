# Build and deploy OCR Web App as Docker Container

## 1. Build docker image

```
$ docker build -t ocr-web-app .
```

This will take some time to complete.
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

## 2. Set environment variables

Create a text file by name `ocr-web-app.env` containing the credentials needed to connect to the other needed services: MongoDB, Object Storage and OCR Engine.
```
$ cat .\ocr-web-app.env
MONGODB_ENDPOINT=mongodb://<username>:<password>@<dbaas_provider_url>/<dbname>
JWT_KEY=<jwt-secret-key>
OBJECT_STORAGE_ENDPOINT=s3.che01.cloud-object-storage.appdomain.cloud
OBJECT_STORAGE_API_KEY_ID=<api-key>
OBJECT_STORAGE_IBM_AUTH_ENDPOINT=https://iam.cloud.ibm.com/identity/token
OBJECT_STORAGE_SERVICE_INSTANCE_ID=crn:v1:bluemix:public:cloud-object-storage:global:a/<instance_id>::
RUN_OCR_ADDRESS=http://<ip-address-of-OCR-REST-API>:9080/
RUN_OCR_PORT=9080
```

## 3. Run the docker

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
