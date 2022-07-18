import express from 'express';
import { Account, VAULTS as SDKVaults } from '@xbacked-dao/xbacked-sdk';
import { collectDefaultMetrics, register } from 'prom-client';
import { VaultContractSourceWithAlerts } from './sources/VaultContractSourceWithAlerts';
import { createVaultMetrics } from './metrics';
import { DiscordAlert } from './monitoring/DiscordAlert';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  // Default metrics from the running node process
  collectDefaultMetrics();

  const app = express();

  // Initialize an account using the xbacked-sdk
  const account = new Account({
    network: process.env.NETWORK as "TestNet" | "MainNet" || "LocalHost",
    mnemonic: process.env.COLLECTOR_MNEMONIC,
  });
  await account.initialiseReachAccount();

  const vaultContractSources: VaultContractSourceWithAlerts[] = [];

  // Initialize an instance of each vault contract to collect the data from
  const algoUsdContract = new VaultContractSourceWithAlerts("ALGO/xUSD", account, SDKVaults.TestNet.algo.vaultId);
  vaultContractSources.push(algoUsdContract);
  const goBtcUsdContract = new VaultContractSourceWithAlerts("goBTC/xUSD", account, SDKVaults.TestNet.gobtc.vaultId, SDKVaults.TestNet.gobtc.assetDecimals);
  vaultContractSources.push(goBtcUsdContract);
  const goEthUsdContract = new VaultContractSourceWithAlerts("goETH/xUSD", account, SDKVaults.TestNet.goeth.vaultId, SDKVaults.TestNet.goeth.assetDecimals);
  vaultContractSources.push(goEthUsdContract);
  const dAlgoUsdContract = new VaultContractSourceWithAlerts("dALGO/xUSD", account, SDKVaults.TestNet.dAlgo.vaultId, SDKVaults.TestNet.dAlgo.assetDecimals);
  vaultContractSources.push(dAlgoUsdContract);

  // Obtain state from source every 30 seconds
  cron.schedule('*/30 * * * * *', function() {
    vaultContractSources.map((source) => {
      source.update();
    });
  });

  // Create metrics for the grafana agent to consume
  createVaultMetrics(algoUsdContract, 'vault_algo_usd');
  createVaultMetrics(goBtcUsdContract, 'vault_gobtc_usd');
  createVaultMetrics(goEthUsdContract, 'vault_goeth_usd');
  createVaultMetrics(dAlgoUsdContract, 'vault_dAlgo_usd');

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

  app.listen(Number(process.env.COLLECTOR_PORT), '0.0.0.0');
})();


