import { Indexer } from "algosdk";
import { convertFromMicroUnits } from "@xbacked-dao/xbacked-sdk";
import { ReachUserVault } from '@xbacked-dao/xbacked-sdk/lib/types/interfaces';
import moment from 'moment';
import { VaultContractSource } from "../sources/VaultContractSource";
import { DiscordAlert } from "../monitoring/DiscordAlert";

export class Collector {

  private indexer: Indexer;
  private sources: VaultContractSource[];
  private tvl: number;
  private isCollecting = false;
  private alert: DiscordAlert;

  constructor(sources: VaultContractSource[]) {
    this.indexer = new Indexer(
      // indexer key
      '',
      // indexer url
      'https://algoindexer.testnet.algoexplorerapi.io',
      // indexer port
      '',
    );
    this.sources = sources;
    this.alert = new DiscordAlert();
    this.collectTVL();
  }

  public getTVL = (): number => {
    if (this.isCollecting) {
      throw new Error("Ongoing TVL collection");
    } else if (!this.tvl) {
      throw new Error("TVL is not set");
    }
    return this.tvl;
  }

  public collectTVL = async (): Promise<void> => {
    if (this.isCollecting) return;

    let tvl = 0;
    this.isCollecting = true;
    try {
      console.log(`Started TVL collection at ${moment().format("HH:mm:ss Z")}`);
      this.alert.send({
        username: `TVL Collection`,
        type: `TVL_COLLECTION_START`,
        msg: `Started TVL collection at ${moment().format("HH:mm:ss Z")}`
      });
      for (const vaultContractSource of this.sources) {
        console.log("Collecting for", vaultContractSource.vaultName);
        vaultContractSource.update();
        const userVaults: ReachUserVault[] = await vaultContractSource.getUserVaults(this.indexer);
        userVaults.map((vault: ReachUserVault) => {
          const collateral = convertFromMicroUnits(vault.collateral, vaultContractSource.asaDecimals);
          const collateralPrice = convertFromMicroUnits(vaultContractSource.lastState.coldState.collateralPrice);
          tvl += collateral * collateralPrice;
        });
      };
      this.tvl = tvl;
      this.isCollecting = false;
      console.log("✅ Successfully collected TVL at", moment().format("HH:mm:ss"));
      console.log(this.tvl);
      this.alert.send({
        username: `TVL Collection`,
        type: `TVL_COLLECTION_SUCCESS`,
        msg: `✅ Successfully collected TVL: $ ${this.tvl.toFixed(4)} USD`
      });
    } catch (err) {
      this.isCollecting = false;
      console.log(err);
      this.alert.send({
        username: `TVL Collection Error`,
        type: `TVL_COLLECTION_FAIL`,
        msg: `🚨 Collector failed to collect TVL\n` +
          `\`\`\`Error: ${err}\`\`\``,
      });
    }
  }

  public confirmTVLCollection = (): void => {
    if (!this.isCollecting && !this.tvl) {
      this.collectTVL();
    }
  }
}

