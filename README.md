Make sure you have the `.env` file setup.

# Test the changes

> Note: You can add `DISABLE_ALERTS=1` to any run command to override the default behavior.

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

Build and push the new chages to the image in ECR. (Get credentials from IAM section on AWS).
```
$ aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $AWS_LOGIN_URL
```
```
$ docker build -t xbacked-collector .
```
> Note: Re building is not necessary if only the `.env` is changed.

```
$ docker tag xbacked-collector:latest $AWS_LOGIN_URL/xbacked-collector:latest
```
```
$ docker push $AWS_LOGIN_URL/xbacked-collector:latest
```
Create AWS context (Only first time)
```
$ docker context create ecs myecscontext
```
If the previous command is failig with `docker context create" requires exactly 1 argument`, install docker compose cli
```
$ curl -L https://raw.githubusercontent.com/docker/compose-cli/main/scripts/install/install_linux.sh | sh
```
Confirm you are in the correct region
```
$ aws configure set default.region us-west-2
```
Deploy to ECS
```
To deploy the container or apply rolling update depending the network specified on `.env` (TestNet or MainNet)
$ NW_NAME=[mainnet|testnet] && docker --context myecscontext compose -f docker-compose-prod.yml --project-name xbacked-collector-$NW_NAME up
```
Done.

---
Other commands:

To Stop the running container
```
$ NW_NAME=[mainnet|testnet] && docker --context myecscontext compose -f docker-compose-prod.yml --project-name xbacked-collector-$NW_NAME down
````
> Note: If `DELETE_FAILED state` error shows up when re creating the container:
> [Solution.](https://aws.amazon.com/es/premiumsupport/knowledge-center/cloudformation-stack-delete-failed/)
> This is because the Load Balancer is retained to preserve DNS record configuration.
