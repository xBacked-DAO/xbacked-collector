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
import { cleanEnv } from './utils/cleanEnv';

dotenv.config();

(async () => {
  // Default metrics from the running node process
  collectDefaultMetrics();

  const app = express();

  const stsParams: STSParams = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  };
  const assumeRoleSpec: AssumeRoleSpec = {
    RoleArn: process.env.AWS_ROLE_ARN,
    RoleSessionName: 'xbacked-collector-session',
  };
  const buffer = Buffer.from(process.env.ENCRYPTED_PASSPHRASE, 'base64');
  const passphrase = await decryptAssumingRole(
    buffer,
    stsParams,
    assumeRoleSpec,
  );

  // Initialize an account using the xbacked-sdk
  const account = new VaultClient({
    network: (process.env.NETWORK as 'TestNet' | 'MainNet') || 'LocalHost',
    mnemonic: passphrase,
  });
  await account.initialiseReachAccount();

  const vaultContractSources: VaultContractSourceWithAlerts[] = [];

  const deployedVaults = SDKVaults[process.env.NETWORK];

  // Initialize an instance of each vault contract to collect the data from
  const algoUsdContract = new VaultContractSourceWithAlerts(
    'ALGO/xUSD',
    account,
    deployedVaults ? deployedVaults.algo : 0,
  );
  vaultContractSources.push(algoUsdContract);



    const newAlgoUsdContract = new VaultContractSourceWithAlerts(
      'ALGO/xUSD',
      account,
      deployedVaults ? deployedVaults.newAlgo : 0,
      false,
      false,
      true,
      false
    );
    vaultContractSources.push(newAlgoUsdContract);

    const newGalgoUsdContract = new VaultContractSourceWithAlerts(
      'gAlgo/xUSD',
      account,
      deployedVaults ? deployedVaults.newGAlgo : 0,
      false,
      false,
      false,
      true,
    );
    vaultContractSources.push(newGalgoUsdContract);

    const newGold$UsdContract = new VaultContractSourceWithAlerts(
      'gold$/xUSD',
      account,
      deployedVaults ? deployedVaults.newMeldGold : 0,
      false,
      false,
      false,
      true
    );
    vaultContractSources.push(newGold$UsdContract);

    const newSilver$UsdContract = new VaultContractSourceWithAlerts(
      'silver$/xUSD',
      account,
      deployedVaults ? deployedVaults.newSilver$ : 0,
      false,
      false,
      false,
      true

    );
    vaultContractSources.push(newSilver$UsdContract);

    const newGoBtcUsdContract = new VaultContractSourceWithAlerts(
      'goBTC/xUSD',
      account,
      deployedVaults ? deployedVaults.newGoBtc : 0,
      false,
      false,
      false,
      true
    );
    vaultContractSources.push(newGoBtcUsdContract);

    const newGoEthUsdContract = new VaultContractSourceWithAlerts(
      'goETH/xUSD',
      account,
      deployedVaults ? deployedVaults.newGoEth : 0,
      false,
      false,
      false,
      true
    );
    vaultContractSources.push(newGoEthUsdContract);

    const newAvaxContract = new VaultContractSourceWithAlerts(
      'wAvax/xUSD',
      account,
      deployedVaults ? deployedVaults.wrappedAvax : 0,
      false,
      false,
      false,
      true,
    );
  vaultContractSources.push(newAvaxContract);

  const newSolUsdContract = new VaultContractSourceWithAlerts(
    'wSol/xUSD',
    account,
    deployedVaults ? deployedVaults.wrappedSol : 0,
    false,
    false,
    false,
    true,
  );
  vaultContractSources.push(newSolUsdContract);

  const newMAlgoContract = new VaultContractSourceWithAlerts(
    'mAlgo/xUSD',
    account,
    deployedVaults ? deployedVaults.mAlgo : 0,
    false,
    false,
    false,
    true,
  );
  vaultContractSources.push(newMAlgoContract);

  const linkUsdContract = new VaultContractSourceWithAlerts(
    'LINK/xUSD',
    account,
    deployedVaults ? deployedVaults.link : 0,
    false,
    false,
    false,
    true,
  );
  vaultContractSources.push(linkUsdContract);

  const coopUsdContract = new VaultContractSourceWithAlerts(
    'COOP/xUSD',
    account,
    deployedVaults ? deployedVaults.coop : 0,
    false,
    false,
    false,
    true,
  );
  vaultContractSources.push(coopUsdContract);

  const chipsUSDContract = new VaultContractSourceWithAlerts(
    'CHIPS/xUSD',
    account,
    deployedVaults ? deployedVaults.chips : 0,
    false,
    false,
    false,
    true,
  );
  vaultContractSources.push(chipsUSDContract);



  // const goBtcUsdContract = new VaultContractSourceWithAlerts("goBTC/xUSD", account, deployedVaults ? deployedVaults.gobtc : 0);
  // vaultContractSources.push(goBtcUsdContract);
  // const goEthUsdContract = new VaultContractSourceWithAlerts("goETH/xUSD", account, deployedVaults ? deployedVaults.goeth : 0);
  // vaultContractSources.push(goEthUsdContract);
  // const dAlgoUsdContract = new VaultContractSourceWithAlerts("dALGO/xUSD", account, deployedVaults ? deployedVaults.dalgo : 0);
  // vaultContractSources.push(dAlgoUsdContract);

  const collector = new Collector(vaultContractSources);

  // Obtain state from source and collect TVL every 60 seconds
  cron.schedule('*/60 * * * * *', async function () {
    await Promise.all(
      vaultContractSources.map((source) => {
        source.update();
      }),
    );
    collector.collectTVL();
  });

  // Create metrics for the grafana agent to consume
  createVaultMetrics(newAlgoUsdContract, 'vault_algo_usd');
  createVaultMetrics(newGalgoUsdContract, 'vault_galgo_usd');
  createVaultMetrics(newGold$UsdContract, 'vault_gold_dollar_usd');
  createVaultMetrics(newSilver$UsdContract, 'vault_silver_dollar_usd');
  createVaultMetrics(newGoBtcUsdContract, 'vault_gobtc_usd');
  createVaultMetrics(newGoEthUsdContract, 'vault_goeth_usd');
  createVaultMetrics(newSolUsdContract, 'vault_sol_usd');
  createVaultMetrics(newMAlgoContract, 'vault_mAlgo_usd');
  createVaultMetrics(newAvaxContract, 'vault_avax_usd');
  createVaultMetrics(linkUsdContract, 'vault_link_usd');
  createVaultMetrics(coopUsdContract, 'vault_coop_usd');
  createVaultMetrics(chipsUSDContract, 'vault_chips_usd');

  // createVaultMetrics(dAlgoUsdContract, 'vault_dAlgo_usd');

  createTVLMetric(collector.getTVL, 'tvl');

  const grafanaAlert = new DiscordAlert(
    parseInt(process.env.ALERT_GRAFANA_COOLDOWN),
  );

  // Create endpoint for the agent to pull the metrics
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      console.log(err);
      grafanaAlert.send({
        username: `Grafana agent alert | ${process.env.NETWORK}`,
        type: 'GRAFANA_AGENT_ERROR',
        msg:
          `Grafana agent failed to retrieve metrics\n` +
          `Verify agent is running in ECS.`,
      });
      res.status(500).end(err);
    }
  });

  app.use('/api/v1', apiRouter(collector.getTVL));

  app.listen(Number(process.env.COLLECTOR_PORT), '0.0.0.0');

  console.log(cleanEnv(process.env));
  const deploymentAlert = new DiscordAlert();
  deploymentAlert.send({
    username: `Collector deployment | ${process.env.NETWORK}`,
    type: 'COLLECTOR_DEPLOYMENT',
    msg:
      `New instance of xbacked-collector has been deployed with env: (alerts in seconds)\n` +
      `\`\`\`${JSON.stringify(cleanEnv(process.env), null, 2)}\`\`\``,
  });
})();