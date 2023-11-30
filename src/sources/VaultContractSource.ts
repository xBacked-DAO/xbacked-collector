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
  protected z_p_f_vault_asa: boolean;
  protected large_cp_vault_asa: boolean
  protected new_algo_vault:boolean
  protected new_asa_vault:boolean

  constructor(
    vaultName: string,
    acc: VaultClient,
    vaultObj: any,
    z_p_f_vault_asa = false,
    large_cp_vault_asa = false,
    new_algo_vault = false,
    new_asa_vault = false
  ) {
    this.vaultName = vaultName;
    this.acc = acc;
    this.vaultId = vaultObj.vaultId;
    this.asaId = vaultObj.assetId || null;
    this.asaDecimals = vaultObj.assetDecimals || null;
    this.z_p_f_vault_asa = z_p_f_vault_asa;
    this.large_cp_vault_asa = large_cp_vault_asa;
    this.new_asa_vault = new_asa_vault;
    this.new_algo_vault = new_algo_vault;
    const initParams = this.asaDecimals
      ? {
          id: this.vaultId,
          asaVault: {
            decimals: this.asaDecimals,
            z_p_f_vault_asa: this.z_p_f_vault_asa,
            large_cp_vault_asa: this.large_cp_vault_asa,
            new_asa_vault: this.new_asa_vault,

          },
        }
      : { id: this.vaultId, new_algo_vault: this.new_algo_vault };

    this.vault = new Vault(initParams);
    this.update();
  }

  readGlobalState = async (): Promise<void> => {
    const state = await this.vault.getState({ account: this.acc });
    if (state) {
      this.lastState = state;
    }
  };

  update = async (): Promise<void> => {
    try {
      this.readGlobalState();
    } catch (err) {
      console.log(`${this.vaultName}: ${err}`);
    }
  };

  getBalance = async (): Promise<number> => {
    try {
      const vaultAddr = await this.acc.getContractAddress({
        contractId: this.vaultId,
        backend: this.vault.backend,
      });
      const collateral = await this.acc.reachStdLib.balanceOf(
        vaultAddr,
        this.asaId,
      );
      return collateral;
    } catch (err) {
      throw `${this.vaultName}: ${err}`;
    }
  };

  getLockedCollateralValue = async (): Promise<number> => {
    try {
      const collateral = convertFromMicroUnits(
        await this.getBalance(),
        this.asaDecimals || 6,
      );
      const collateralPrice = convertFromMicroUnits(
        this.lastState.coldState.collateralPrice,
      );
      return collateral * collateralPrice;
    } catch (err) {
      throw `${this.vaultName}: ${err}`;
    }
  };
}
