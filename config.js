module.exports = {
  COINS_PER_INVITE: 100,     // coins credited to the inviter when their invite is used
  DATA_FILE: './data.json',  // simple JSON "database"
  PREFIX: '!',               // prefix for text commands, e.g. !c
  VPS_DEPLOY: {
    REQUIRED_INVITES: 6,
    COST: 300,
  },
  DOCKER: {
    IMAGE: 'coin-bot-vps',       // build this once yourself: see docker/README.md
    MEMORY: '2g',                 // per-container RAM limit
    CPUS: '1',                   // per-container CPU limit
    PORT_RANGE: [20000, 20100],  // host ports handed out for SSH, one per container
    SSH_HOST: 'your-vps-ip-or-domain', // <-- CHANGE THIS to your real VPS public IP or domain
    MAX_CONTAINERS: 10,          // hard cap on total VPS containers ever created
    SUSPEND_AFTER_DAYS: 30,      // auto-suspend (docker stop) a container this many days after creation
  },
  SHOP: [
    // "cost: 7" -> the item that costs 7 coins, as requested
    { id: 'mystery_box', name: '🎁 Mystery Box', cost: 7, description: 'A small mystery reward.' },
    { id: 'vip_role',    name: '⭐ VIP Role',     cost: 250, description: 'Grants a VIP role in the server.' },
    { id: 'shoutout',    name: '📣 Shoutout',     cost: 50, description: 'A shoutout in the announcements channel.' },
  ],
  // If you want "vip_role" to actually grant a real Discord role, put the role ID here.
  VIP_ROLE_ID: null, // e.g. '123456789012345678'
};
