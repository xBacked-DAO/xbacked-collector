import express from 'express';
import {
  VaultClient,
  VAULTS as SDKVaults,
  decryptAssumingRole,
  STSParams,
  AssumeRoleSpec,
} from '@xbacked-dao/xbacked-sdk';
import { collectDefaultMetrics, register } from 'prom-client';
import { VaultContractSourceWithAlerts } from './sources/VaultContractSourceWithAlerts';
import { createVaultMetrics, createTVLMetric } from './metrics';
import { DiscordAlert } from './monitoring/DiscordAlert';
import { Collector } from './collector/Collector';
import { apiRouter } from './api';
import cron from 'node-cron';
import dotenv from 'dotenv';
import console from 'console';

dotenv.config();

(async () => {
  // Default metrics from the running node process
  collectDefaultMetrics();

  const app = express();

  const stsParams: STSParams = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  };
  const assumeRoleSpec: AssumeRoleSpec = {
    RoleArn: process.env.AWS_ROLE_ARN,
    RoleSessionName: "xbacked-collector-session"
  };
  const buffer = Buffer.from(process.env.ENCRYPTED_PASSPHRASE, 'base64');
  const passphrase = await decryptAssumingRole(buffer, stsParams, assumeRoleSpec);

  // Initialize an account using the xbacked-sdk
  const account = new VaultClient({
    network: process.env.NETWORK as "TestNet" | "MainNet" || "LocalHost",
    mnemonic: passphrase
  });
  await account.initialiseReachAccount();

  const vaultContractSources: VaultContractSourceWithAlerts[] = [];

  const deployedVaults = SDKVaults[process.env.NETWORK];

  // Initialize an instance of each vault contract to collect the data from
  const algoUsdContract = new VaultContractSourceWithAlerts("ALGO/xUSD", account, deployedVaults ? deployedVaults.algo : 0);
  vaultContractSources.push(algoUsdContract);

  // const goBtcUsdContract = new VaultContractSourceWithAlerts("goBTC/xUSD", account, deployedVaults ? deployedVaults.gobtc : 0);
  // vaultContractSources.push(goBtcUsdContract);
  // const goEthUsdContract = new VaultContractSourceWithAlerts("goETH/xUSD", account, deployedVaults ? deployedVaults.goeth : 0);
  // vaultContractSources.push(goEthUsdContract);
  // const dAlgoUsdContract = new VaultContractSourceWithAlerts("dALGO/xUSD", account, deployedVaults ? deployedVaults.dalgo : 0);
  // vaultContractSources.push(dAlgoUsdContract);

  const collector = new Collector(vaultContractSources);

  // Obtain state from source and collect TVL every 60 seconds
  cron.schedule('*/60 * * * * *', async function() {
    await Promise.all(vaultContractSources.map((source) => {
      source.update();
    }));
    collector.collectTVL();
  });


  // Create metrics for the grafana agent to consume
  createVaultMetrics(algoUsdContract, 'vault_algo_usd');
  // createVaultMetrics(goBtcUsdContract, 'vault_gobtc_usd');
  // createVaultMetrics(goEthUsdContract, 'vault_goeth_usd');
  // createVaultMetrics(dAlgoUsdContract, 'vault_dAlgo_usd');

  createTVLMetric(collector.getTVL, 'tvl');

  const grafanaAlert = new DiscordAlert(parseInt(process.env.ALERT_GRAFANA_COOLDOWN));

  // Create endpoint for the agent to pull the metrics
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      console.log(err);
      grafanaAlert.send({
        username: `Grafana agent alert`,
        type: "GRAFANA_AGENT_ERROR",
        msg: `Grafana agent failed to retrieve metrics\n`+
        `Verify agent is running in ECS.`,
      });
      res.status(500).end(err);
    }
  });

  app.use('/api/v1', apiRouter(collector.getTVL));

  app.listen(Number(process.env.COLLECTOR_PORT), '0.0.0.0');
})();