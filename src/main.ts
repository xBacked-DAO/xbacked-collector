import express from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import { Account, VAULTS as SDKVaults } from '@xbacked-dao/xbacked-sdk';
import { VaultContractSource } from './sources/vaultContractSource.js';
import { VaultMetrics } from './metrics/vaultMetrics.js';
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
  const algoUsdContract = new VaultContractSource(account, SDKVaults.TestNet.algo.vaultId);
  const goBtcUsdContract = new VaultContractSource(account, SDKVaults.TestNet.gobtc.vaultId, SDKVaults.TestNet.gobtc.assetDecimals);
  const goEthUsdContract = new VaultContractSource(account, SDKVaults.TestNet.goeth.vaultId, SDKVaults.TestNet.goeth.assetDecimals);

  try {
    algoUsdContract.readGlobalState();
  } catch (err) {
    console.log('algo: '+err);
  }
  try {
    goBtcUsdContract.readGlobalState();
  } catch (err) {
    console.log('btc: '+err);
  }
  try {
    goEthUsdContract.readGlobalState();
  } catch (err) {
    console.log('eth: '+err);
  }

  // Obtain state from source every 30 seconds
  cron.schedule('*/30 * * * * *', function() {
    try {
      algoUsdContract.readGlobalState();
    } catch (err) {
      console.log('algo: '+err);
    }
    try {
      goBtcUsdContract.readGlobalState();
    } catch (err) {
      console.log('btc: '+err);
    }
    try {
      goEthUsdContract.readGlobalState();
    } catch (err) {
      console.log('eth: '+err);
    }
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

  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end(err);
    }
  });

  app.listen(Number(process.env.COLLECTOR_PORT), '0.0.0.0');
})();


