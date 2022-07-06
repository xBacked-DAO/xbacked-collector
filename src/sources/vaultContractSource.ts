import { Account, Vault } from '@xbacked-dao/xbacked-sdk';
import { VaultReturnParams } from '@xbacked-dao/xbacked-sdk/lib/types/interfaces';

export class VaultContractSource {
  protected vaultName: string;
  protected acc: Account;
  protected vault: Vault;
  protected vaultId: number;
  protected asaDecimals: number;
  public lastState: VaultReturnParams;

  constructor(vaultName: string, acc: Account, vaultId: number, asaDecimals?: number) {
    this.vaultName = vaultName;
    this.acc = acc;
    this.vaultId = vaultId;
    this.asaDecimals = asaDecimals;

    const initParams = this.asaDecimals ?
      { id: this.vaultId, asaVault: { decimals: this.asaDecimals } } :
      { id: this.vaultId };

    this.vault = new Vault(initParams);
    this.update();
  }

  readGlobalState = async () : Promise<void> => {
    try {
      this.lastState = await this.vault.getState({ account: this.acc });
    } catch(err) {
      console.log(`${this.vaultName}: ${err}`);
    }
  }

  update = async (): Promise<void> => {
    this.readGlobalState();
  }
}
