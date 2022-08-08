import moment from 'moment';
import { VaultClient } from '@xbacked-dao/xbacked-sdk';
import { VaultContractSource } from "./VaultContractSource";
import { DiscordAlert } from '../monitoring/DiscordAlert';

import dotenv from 'dotenv';

dotenv.config();

export class VaultContractSourceWithAlerts extends VaultContractSource {

  protected prevCollateralPrice: number;
  protected priceChangeTimestamp: moment.Moment;

  protected vaultReadAlert = new DiscordAlert(parseInt(process.env.ALERT_VAULT_READ_COOLDOWN));
  protected oracleAlert = new DiscordAlert(parseInt(process.env.ALERT_ORACLE_COOLDOWN));
  protected redemptionAlert = new DiscordAlert(parseInt(process.env.ALERT_REDEMPTION_COOLDOWN));

  constructor(vaultName: string, acc: VaultClient, vaultObj: any) {
    super(vaultName, acc, vaultObj);
  }

  update: () => Promise<void> = async () => {
    try{
      await this.readGlobalState();
      this.checkPriceChange();
      this.checkProposalTime();
    } catch(err) {
      console.log(`${this.vaultName}: ${err}`);
      this.vaultReadAlert.send({
        username: `State read alert`,
        type: `VAULT_READ_STATE_FAIL-${this.vaultName}`,
        msg: `🚨 Collector failed to retrieve vault state for **${this.vaultName}**\n` +
          `\`\`\`Error: ${err}\`\`\``,
      });
    }
  }

  checkPriceChange = () : void => {
    if (!this.prevCollateralPrice
      || this.lastState.coldState.collateralPrice != this.prevCollateralPrice) {
      this.prevCollateralPrice = this.lastState.coldState.collateralPrice;
      this.priceChangeTimestamp = moment();
    }
    const timeUnchanged = moment().diff(this.priceChangeTimestamp, 's');
    if(timeUnchanged >= parseInt(process.env.ALERT_ORACLE_THRESHOLD)) {
      this.oracleAlert.send({
        username: `Oracle alert`,
        type: `ORACLE_PRICE_UNCHANGED-${this.vaultName}`,
        msg: `🚨 Oracle price has not changed in ${Math.round(timeUnchanged/60)} minutes for **${this.vaultName}**\n` +
        `Is the Oracle running?`
      });
    }
  }

  checkProposalTime = () : void => {
    const lastTimeProposed = moment.unix(this.lastState.coldState.proposalTime);
    const timeWithoutProposal = moment().diff(lastTimeProposed, 's');
    if(timeWithoutProposal >= parseInt(process.env.ALERT_REDEMPTION_THRESHOLD)) {
      this.redemptionAlert.send({
        username: `Keepers alert`,
        type: `KEEPERS_NOT_PROPOSING-${this.vaultName}`,
        msg: `🚨 Redemption address has not been proposed since `+
          `${lastTimeProposed.format('YYYY-MM-DD HH:mm Z')} for **${this.vaultName}**\n` +
          `Are the keepers running?`
      });
    }
  }
}