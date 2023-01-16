import moment from 'moment';
import { VaultContractSource } from "../sources/VaultContractSource";
import { DiscordAlert } from "../monitoring/DiscordAlert";

import dotenv from 'dotenv';

dotenv.config();

export class Collector {
  private sources: VaultContractSource[];
  private tvl = 0;
  private isCollecting = false;
  private alert: DiscordAlert;

  constructor(sources: VaultContractSource[]) {
    this.sources = sources;
    this.alert = new DiscordAlert(parseInt(process.env.ALERT_TVL_COLLECTION_COOLDOWN));
  }

  public getTVL = (): number => {
    if (this.tvl === undefined)  {
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
      for (const vaultContractSource of this.sources) {
        console.log("Collecting for", vaultContractSource.vaultName, "on", process.env.NETWORK);
        tvl += await vaultContractSource.getLockedCollateralValue();
      };
      this.tvl = tvl;
      this.isCollecting = false;
      console.log("✅ Successfully collected TVL at", moment().format("HH:mm:ss"));
      console.log(this.tvl);
    } catch (err) {
      this.isCollecting = false;
      console.log(err);
      this.alert.send({
        username: `TVL Collection Error | ${process.env.NETWORK}`,
        type: `TVL_COLLECTION_FAIL`,
        msg: `🚨 Collector failed to collect TVL\n` +
          `\`\`\`Error: ${err}\`\`\``,
      });
    }
  }
}

