export COUCHDB_PORT="${COUCHDB_PORT:-5984}"
docker stop couchdb
docker run -d --rm -p ${COUCHDB_PORT}:5984 -v /home/couchdb/data:/opt/couchdb/data -v /home/couchdb/etc:/opt/couchdb/etc/local.d --name couchdb couchdb:3
