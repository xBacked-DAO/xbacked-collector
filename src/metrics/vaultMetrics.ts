import { Gauge }  from 'prom-client';
import { ContractSource } from '../sources/contractSource.js';

export class VaultMetrics {
  public source: ContractSource;

  constructor(source: ContractSource) {
    this.source = source;
  }

  getLastStateFromSource = () => {
    return this.source.lastState;
  }

  createAccruedFeesMetric = () => {
    const getLastStateFromSource = this.getLastStateFromSource;
    return new Gauge({
      name: 'vault_algo_usd_accrued_fees',
      help: 'Total accrued fees in the vault',
      collect() {
        // Invoked when the registry collects its metrics' values.
        // This can be synchronous or it can return a promise/be an async function.
        const state = getLastStateFromSource();
        this.set(state.accruedFees);
      },
    });
  }

  createCollateralPriceMetric = () => {
    const getLastStateFromSource = this.getLastStateFromSource;
    return new Gauge({
      name: 'vault_algo_usd_collateral_price',
      help: 'Current collateral price in the vault',
      async collect() {
        const state = getLastStateFromSource();
        this.set(state.collateralPrice);
      },
    });
  }

  createTotalVaultDebtMetric = () => {
    const getLastStateFromSource = this.getLastStateFromSource;
    return new Gauge({
      name: 'vault_algo_usd_total_vault_debt',
      help: 'Total vault debt in the vault',
      collect() {
        const state = getLastStateFromSource();
        this.set(state.totalVaultDebt);
      },
    });
  }

  createAccruedInterestMetric = () => {
    const getLastStateFromSource = this.getLastStateFromSource;
    return new Gauge({
      name: 'vault_algo_usd_accrued_interest',
      help: 'The accrued interest in a vault awaiting distribution via settleInterest',
      collect() {
        const state = getLastStateFromSource();
        this.set(state.accruedInterest);
      },
    });
  }
}