docker build -t andyfeetenby/multi-client:latest -t andyfeetenby/multi-client:$GIT_SHA -f ./client/Dockerfile ./client
docker build -t andyfeetenby/multi-server:latest -t andyfeetenby/multi-server:$GIT_SHA -f ./server/Dockerfile ./server
docker build -t andyfeetenby/multi-worker:latest -t andyfeetenby/multi-worker:$GIT_SHA -f ./worker/Dockerfile ./worker

docker push andyfeetenby/multi-client:latest
docker push andyfeetenby/multi-server:latest
docker push andyfeetenby/multi-worker:latest

docker push andyfeetenby/multi-client:$GIT_SHA
docker push andyfeetenby/multi-server:$GIT_SHA
docker push andyfeetenby/multi-worker:$GIT_SHA

kubectl apply -f k8s

kubectl set image deployments/server-deployment server=andyfeetenby/multi-server:$GIT_SHA
kubectl set image deployments/client-deployment client=andyfeetenby/multi-client:$GIT_SHA
kubectl set image deployments/worker-deployment worker=andyfeetenby/multi-worker:$GIT_SHA