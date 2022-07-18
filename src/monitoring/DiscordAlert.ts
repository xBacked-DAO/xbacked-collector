import axios from 'axios';
import moment from 'moment';

interface AlertBody {
  username: string,
  type: string;
  msg: string;
}

export class DiscordAlert {

  private cooldown: number; // In seconds
  private lastSent: moment.Moment;

  constructor(cooldown: number = 60) {
    this.cooldown = cooldown;
  }

  // Post alerts using axios to zapier integration
  send = (alertBody: AlertBody) : void =>  {
    if(!this.lastSent || moment().diff(this.lastSent, 's') >= this.cooldown) {
      const params = {
        username: alertBody.username,
        avatar_url: "https://beta.xbacked.io/android-chrome-192x192.png",
        content: alertBody.msg,
      };
      axios.post(process.env.DISCORD_HOOK_URL, params)
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