import { VaultClient, Vault, convertFromMicroUnits } from '@xbacked-dao/xbacked-sdk';
import { VaultReturnParams } from '@xbacked-dao/xbacked-sdk/lib/types/interfaces';

export class VaultContractSource {
  public vaultName: string;
  protected acc: VaultClient;
  protected vault: Vault;
  protected vaultId: number;
  protected asaId: number;
  public asaDecimals: number;
  public lastState: VaultReturnParams;

  constructor(vaultName: string, acc: VaultClient, vaultObj: any) {
    this.vaultName = vaultName;
    this.acc = acc;
    this.vaultId = vaultObj.vaultId;
    this.asaId = vaultObj.assetId || null;
    this.asaDecimals = vaultObj.assetDecimals || null;

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

  getBalance = async (): Promise<number> => {
    try {
      const vaultAddr = await this.acc.getContractAddress({
        contractId: this.vaultId,
        backend: this.vault.backend
      });
      const collateral = await this.acc.reachStdLib.balanceOf(vaultAddr, this.asaId);
      return collateral;
    } catch(err) {
      throw(`${this.vaultName}: ${err}`);
    }
  }

  getLockedCollateralValue = async (): Promise<number> => {
    try {
      const collateral = convertFromMicroUnits(await this.getBalance(), this.asaDecimals || 6);
      const collateralPrice = convertFromMicroUnits(this.lastState.coldState.collateralPrice);
      return collateral * collateralPrice;
    } catch(err) {
      throw(`${this.vaultName}: ${err}`);
    }
  }
}
