import { Gauge }  from 'prom-client';
import { ContractSource } from '../sources/contractSource.js';

export class VaultMetrics {
  public source: ContractSource;

  constructor(source: ContractSource) {
    this.source = source;
  }

  createAccruedFeesMetric = () => {
    const state = this.source.lastState;
    return new Gauge({
      name: 'vault_algo_usd_accrued_fees',
      help: 'Total accrued fees in the vault',
      async collect() {
        // Invoked when the registry collects its metrics' values.
        // This can be synchronous or it can return a promise/be an async function.
        this.set(state.accruedFees);
      },
    });
  }

  createCollateralPriceMetric = () => {
    const state = this.source.lastState;
    return new Gauge({
      name: 'vault_algo_usd_collateral_price',
      help: 'Current collateral price in the vault',
      async collect() {
        this.set(state.collateralPrice);
      },
    });
  }

  createTotalVaultDebtMetric = () => {
    const state = this.source.lastState;
    return new Gauge({
      name: 'vault_algo_usd_total_vault_debt',
      help: 'Total vault debt in the vault',
      async collect() {
        this.set(state.totalVaultDebt);
      },
    });
  }

  createAccruedInterestMetric = () => {
    const state = this.source.lastState;
    return new Gauge({
      name: 'vault_algo_usd_accrued_interest',
      help: 'The accrued interest in a vault awaiting distribution via settleInterest',
      async collect() {
        this.set(state.accruedInterest);
      },
    });
  }
}