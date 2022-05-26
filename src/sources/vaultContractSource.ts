import { Account, Vault } from '@xbacked-dao/xbacked-sdk';
import { VaultReturnParams } from '@xbacked-dao/xbacked-sdk/lib/types/interfaces';

export class VaultContractSource {
  public acc: Account;
  public vault: Vault;
  public vaultId: number;
  public asaDecimals: number;
  public lastState: VaultReturnParams;

  constructor(acc: Account, vaultId: number, asaDecimals?: number) {
    this.acc = acc;
    this.vaultId = vaultId;
    this.asaDecimals = asaDecimals;

    const initParams = this.asaDecimals ?
      { id: this.vaultId, asaVault: { decimals: this.asaDecimals } } :
      { id: this.vaultId };

    this.vault = new Vault(initParams);
  }

  readGlobalState = async () : Promise<void> => {
    this.lastState = await this.vault.getState({ account: this.acc });
  }
}
