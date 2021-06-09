export COUCH_DB_ADMIN_USERNAME=${COUCH_DB_ADMIN_USERNAME:-admin}
export COUCH_DB_ADMIN_PASSWORD=${COUCH_DB_ADMIN_PASSWORD:-Admin1234}
export COUCH_DB_HOST=${COUCH_DB_HOST:-localhost}
export COUCH_DB_URL="http://${COUCH_DB_ADMIN_USERNAME}:${COUCH_DB_ADMIN_PASSWORD}@${COUCH_DB_HOST}:5984"

curl -v -X PUT "${COUCH_DB_URL}/_users"

export OCR_USER_NAME=${OCR_USER_NAME:-ocr@gmail.com}
export OCR_USER_PASSWORD=${OCR_USER_PASSWORD:-ocr123}
export OBJECT_STORAGE_BUCKET_NAME=${OBJECT_STORAGE_BUCKET_NAME:-ocrbucket}

curl -v -X POST -H 'Content-Type: application/json' "${COUCH_DB_URL}/_users" --data-binary '{"_id": "org.couchdb.user:'${OCR_USER_NAME}'", "name": "'${OCR_USER_NAME}'", "roles": ["admin"], "type": "user", "password":"'${OCR_USER_PASSWORD}'", "bucketName":"'${OBJECT_STORAGE_BUCKET_NAME}'", "userId": "'$(echo ${OCR_USER_NAME}|sha1sum|awk '{print $1}')'"}'

