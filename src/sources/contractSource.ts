import { source } from './source';
import { Account, Vault } from '@xbacked-dao/xbacked-sdk';
import { VaultReturnParams } from '@xbacked-dao/xbacked-sdk/lib/types/Vault';

export class ContractSource implements source {
  public acc: Account;
  public vault: Vault;
  public lastState: VaultReturnParams;

  init = async () => {
    try {
      this.acc = new Account({
        network: process.env.NETWORK as "TestNet" | "MainNet" || "LocalHost",
        mnemonic: process.env.COLLECTOR_MNEMONIC,
      });
      await this.acc.initialiseReachAccount();
      this.vault = new Vault({ id: Number(process.env.ALGO_USD_VAULT_ID) });
    } catch (err) {
      console.log("Failed to init source", err);
    }
  }

  readGlobalState = async () : Promise<VaultReturnParams> => {
    return this.vault.getState({ account: this.acc });
  }
}

