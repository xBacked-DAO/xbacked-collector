import axios from 'axios';
import moment from 'moment';

interface AlertBody {
  type: string;
  msg: string;
}

export class ZapierAlert {

  private cooldown: number; // In seconds
  private lastSent: moment.Moment;

  constructor(cooldown: number) {
    this.cooldown = cooldown;
  }

  // Post alerts using axios to zapier integration
  send = (alertBody: AlertBody) : void =>  {
    if(!this.lastSent || moment().diff(this.lastSent, 's') >= this.cooldown) {
      console.log(moment().diff(this.lastSent, 's'), this.cooldown);
      axios.post(process.env.ZAPIER_ALERT_URL, alertBody)
      .then(() => {
        console.log("Alert sent", alertBody);
        this.lastSent = moment();
      })
      .catch(error => {
        console.log(error);
      });
    }
  }
}