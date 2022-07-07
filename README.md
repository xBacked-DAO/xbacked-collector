Make sure you have the `.env` file setup.

# Test the changes
```
$ npm run start
```
Then open [localhost:4001/metrics]() to confirm the metrics values are being set

# Testing metrics locally while pushing to Grafana
```
$ docker compose -f docker-compose-local.yml build
```
```
$ docker compose -f docker-compose-local.yml up
```

# Deploy to production

Build and push the new chages to the image in ECR.
```
$ aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 578642810119.dkr.ecr.us-west-2.amazonaws.com
```
```
$ docker build -t xbacked-collector .
```
```
$ docker tag xbacked-collector:latest 578642810119.dkr.ecr.us-west-2.amazonaws.com/xbacked-collector:latest
```
```
$ docker push 578642810119.dkr.ecr.us-west-2.amazonaws.com/xbacked-collector:latest
```
Create AWS context (Only first time)
```
$ docker context create ecs myecscontext
```
Confirm you are in the correct region
```
$ aws configure set default.region us-west-2
```
Deploy to ECS
```
To deploy the container or apply rolling update
$ docker --context myecscontext compose -f docker-compose-prod.yml up
```
Stop the running container
```
$ docker --context myecscontext compose -f docker-compose-prod.yml down
````

> :warning: Note: `docker-compose-prod.yml` points to a public remote location where the grafana agent config is stored. (Ideally in the public repo).
> While this repo remains private an S3 bucket is used to host a public copy of the config file. (It need to be manually updated if any change is made).
(`- -config.file=https://xbacked-collector-agent-config.s3.amazonaws.com/agent.yaml`)