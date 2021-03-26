1. Log in to your IBM Cloud account.
```
ibmcloud login -a cloud.ibm.com -r jp-tok -g Default
```

2. Set the Kubernetes context to your cluster for this terminal session.
```
ibmcloud ks cluster config --cluster <clusterID>
```

3. Verify that you can connect to your cluster.
```
kubectl config current-context
```

[create Secret using kubectl command](https://kubernetes.io/docs/tasks/configmap-secret/managing-secret-using-kubectl/)
```
kubectl.exe create secret --help
```

Example:
Create a folder by name `couchdb` and create files within it for each of the secrets:
```
$ mkdir couchdb
$ cd couchdb
$ echo "xxxxxxxxxx-bluemix.cloudantnosqldb.appdomain.cloud" >> couchDbHost
$ echo "apikey-v2-yyyyyy" >> couchDbAdminUsername
$ echo "zzzzzzz" >> couchDbAdminPassword
$ echo "IBM_CLOUDANT" >> couchDbProvider
```

Use `kubectl create secret` to create the Kubernete secrets
```
kubectl create secret generic couchdb-secret --from-file=./couchdb-secret
```
