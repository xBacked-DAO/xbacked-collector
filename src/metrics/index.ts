import { VaultContractSource } from "../sources/VaultContractSource";
import { VaultMetrics } from "./VaultMetrics";

export const createVaultMetrics = (source: VaultContractSource, metricLabel: string): void => {
  const vaultMetrics = new VaultMetrics(source);
  vaultMetrics.createAccruedFeesMetric(metricLabel);
  vaultMetrics.createCollateralPriceMetric(metricLabel);
  vaultMetrics.createTotalVaultDebtMetric(metricLabel);
  vaultMetrics.createAccruedInterestMetric(metricLabel);
}