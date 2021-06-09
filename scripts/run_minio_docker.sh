export MINIO_DATADIR=${MINIO_DATADIR:-/home/minio}
export MINIO_ROOT_USER=${MINIO_ROOT_USER:-admin}
export MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-Sxckhm23@k3}
docker stop minio
docker run -d --rm -p 9000:9000 -v ${MINIO_DATADIR}:/data -e "MINIO_ROOT_USER=${MINIO_ROOT_USER}" -e "MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}" --name minio minio/minio server /data
