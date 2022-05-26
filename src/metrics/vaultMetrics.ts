import { Gauge }  from 'prom-client';
import { VaultContractSource } from '../sources/vaultContractSource.js';

export class VaultMetrics {
  public source: VaultContractSource;

  constructor(source: VaultContractSource) {
    this.source = source;
  }

  getLastStateFromSource = () => {
    return this.source.lastState;
  }

  createAccruedFeesMetric = (prefix: string) => {
    const getLastStateFromSource = this.getLastStateFromSource;
    return new Gauge({
      name: `${prefix}_accrued_fees`,
      help: 'Total accrued fees in the vault',
      collect() {
        // Invoked when the registry collects its metrics' values.
        // This can be synchronous or it can return a promise/be an async function.
        const state = getLastStateFromSource();
        this.set(state.coldState.accruedFees);
      },
    });
  }

  createCollateralPriceMetric = (prefix: string) => {
    const getLastStateFromSource = this.getLastStateFromSource;
    return new Gauge({
      name: `${prefix}_collateral_price`,
      help: 'Current collateral price in the vault',
      async collect() {
        const state = getLastStateFromSource();
        this.set(state.coldState.collateralPrice);
      },
    });
  }

  createTotalVaultDebtMetric = (prefix: string) => {
    const getLastStateFromSource = this.getLastStateFromSource;
    return new Gauge({
      name: `${prefix}_total_vault_debt`,
      help: 'Total vault debt in the vault',
      collect() {
        const state = getLastStateFromSource();
        this.set(state.hotState.totalVaultDebt);
      },
    });
  }

  createAccruedInterestMetric = (prefix: string) => {
    const getLastStateFromSource = this.getLastStateFromSource;
    return new Gauge({
      name: `${prefix}_accrued_interest`,
      help: 'The accrued interest in a vault awaiting distribution via settleInterest',
      collect() {
        const state = getLastStateFromSource();
        this.set(state.hotState.accruedInterest);
      },
    });
  }
}