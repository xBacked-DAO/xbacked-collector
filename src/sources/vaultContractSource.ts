import { getAllAccounts, VaultClient, Vault } from '@xbacked-dao/xbacked-sdk';
import { VaultReturnParams, ReachUserVault } from '@xbacked-dao/xbacked-sdk/lib/types/interfaces';

export class VaultContractSource {
  public vaultName: string;
  protected acc: VaultClient;
  protected vault: Vault;
  protected vaultId: number;
  public asaDecimals: number;
  public lastState: VaultReturnParams;

  constructor(vaultName: string, acc: VaultClient, vaultId: number, asaDecimals?: number) {
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

  getUserVaults = async (indexer: any): Promise<ReachUserVault[]> => {
    try {
      const vaultAccounts = await getAllAccounts(this.vaultId, indexer, [], null);
      const reachUserVaults = [];
      for (const vaultAccount of vaultAccounts) {
        reachUserVaults.push(await this.acc.getUserInfo({address: vaultAccount.address, vault: this.vault}));
      };
      return reachUserVaults;
    } catch(err) {
      throw(`${this.vaultName}: ${err}`);
    }
  }
}
