import express from 'express';
import { Account, VAULTS as SDKVaults } from '@xbacked-dao/xbacked-sdk';
import { collectDefaultMetrics, register } from 'prom-client';
import { VaultContractSourceWithAlerts } from './sources/VaultContractSourceWithAlerts';
import { VaultMetrics } from './metrics/VaultMetrics';
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

  // Initialize an instance of each vault contract to collect the data from
  const algoUsdContract = new VaultContractSourceWithAlerts("ALGO/xUSD", account, SDKVaults.TestNet.algo.vaultId);
  const goBtcUsdContract = new VaultContractSourceWithAlerts("goBTC/xUSD", account, SDKVaults.TestNet.gobtc.vaultId, SDKVaults.TestNet.gobtc.assetDecimals);
  const goEthUsdContract = new VaultContractSourceWithAlerts("goETH/xUSD", account, SDKVaults.TestNet.goeth.vaultId, SDKVaults.TestNet.goeth.assetDecimals);

  // Obtain state from source every 30 seconds
  cron.schedule('*/30 * * * * *', function() {
    algoUsdContract.update();
    goBtcUsdContract.update();
    goEthUsdContract.update();
  });

  // Create metrics for the grafana agent to consume
  const algoUsdMetrics = new VaultMetrics(algoUsdContract);
  algoUsdMetrics.createAccruedFeesMetric('vault_algo_usd');
  algoUsdMetrics.createCollateralPriceMetric('vault_algo_usd');
  algoUsdMetrics.createTotalVaultDebtMetric('vault_algo_usd');
  algoUsdMetrics.createAccruedInterestMetric('vault_algo_usd');

  const goBtcUsdMetrics = new VaultMetrics(goBtcUsdContract);
  goBtcUsdMetrics.createAccruedFeesMetric('vault_gobtc_usd');
  goBtcUsdMetrics.createCollateralPriceMetric('vault_gobtc_usd');
  goBtcUsdMetrics.createTotalVaultDebtMetric('vault_gobtc_usd');
  goBtcUsdMetrics.createAccruedInterestMetric('vault_gobtc_usd');

  const goEthUsdMetrics = new VaultMetrics(goEthUsdContract);
  goEthUsdMetrics.createAccruedFeesMetric('vault_goeth_usd');
  goEthUsdMetrics.createCollateralPriceMetric('vault_goeth_usd');
  goEthUsdMetrics.createTotalVaultDebtMetric('vault_goeth_usd');
  goEthUsdMetrics.createAccruedInterestMetric('vault_goeth_usd');

  const grafanaAlert = new DiscordAlert(parseInt(process.env.ALERT_GRAFANA_COOLDOWN));

  // Create endpoint for the agent to pull the metrics
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      console.log(err);
      grafanaAlert.send({
        type: "GRAFANA_AGENT_ERROR",
        msg: `Grafana agent failed to retrieve metrics\n`+
        `Verify agent is running in ECS.`,
      });
      res.status(500).end(err);
    }
  });

  app.listen(Number(process.env.COLLECTOR_PORT), '0.0.0.0');
})();


