const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2103443",
  key: process.env.PUSHER_KEY || "2c6a6d2d91a43714d013",
  secret: process.env.PUSHER_SECRET || "701702118a29427eff49",
  cluster: process.env.PUSHER_CLUSTER || "mt1",
  useTLS: true
});

module.exports = { pusher };
