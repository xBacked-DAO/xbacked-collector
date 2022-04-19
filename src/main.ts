import express from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import { ContractSource } from './sources/contractSource.js';
import { VaultMetrics } from './metrics/vaultMetrics.js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  collectDefaultMetrics();

  const app = express();

  const contractSource = new ContractSource();
  await contractSource.init();
  await contractSource.readGlobalState();

  // Obtain state from source every 30 seconds
  cron.schedule('*/30 * * * * *', function() {
    contractSource.readGlobalState();
  });

  const vaultMetrics = new VaultMetrics(contractSource);
  vaultMetrics.createAccruedFeesMetric();
  vaultMetrics.createCollateralPriceMetric();
  vaultMetrics.createTotalVaultDebtMetric();
  vaultMetrics.createAccruedInterestMetric();

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


