import { Gauge }  from 'prom-client';
import { VaultContractSource } from "../sources/VaultContractSource";
import { VaultMetrics } from "./VaultMetrics";

export const createVaultMetrics = (source: VaultContractSource, metricLabel: string): void => {
  const vaultMetrics = new VaultMetrics(source);
  vaultMetrics.createAccruedFeesMetric(metricLabel);
  vaultMetrics.createCollateralPriceMetric(metricLabel);
  vaultMetrics.createTotalVaultDebtMetric(metricLabel);
  vaultMetrics.createAccruedInterestMetric(metricLabel);
}

export const createTVLMetric = (getTVL: () => number, metricLabel: string) => {
  return new Gauge({
    name: `${metricLabel}`,
    help: 'Protocol TVL',
    collect() {
      // Invoked when the registry collects its metrics' values.
      // This can be synchronous or it can return a promise/be an async function.
      try {
        this.set(getTVL());
      } catch(err) {}
    },
  });
}