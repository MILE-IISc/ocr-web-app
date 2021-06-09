docker stop ocr-web-app
docker run -d --rm -p 8080:8080 --env-file ocr-web-app.env --name ocr-web-app mile-ocr-web-app
