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

Configure the AWS URL `export AWS_LOGIN_URL=[AWS-LOGIN-URL]` and the .env file. (All configuration is grabbed from there).

Create AWS context (Only first time)
```
$ docker context create ecs myecscontext
```
If the previous command is failing with `docker context create" requires exactly 1 argument`, install docker compose cli
```
$ curl -L https://raw.githubusercontent.com/docker/compose-cli/main/scripts/install/install_linux.sh | sh
```
Confirm you are in the correct region
```
$ aws configure set default.region us-west-2
```
Build and push the image to AWS ECR
```
$ yarn aws:prepare
```
To deploy the container or apply rolling update depending the network specified on `.env` (TestNet or MainNet)
```
$ yarn aws:deploy:mainnet or yarn aws:deploy:testnet
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