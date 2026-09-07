const { setGuildInviteUses } = require('../database');
const { checkAndSuspendExpiredContainers } = require('../lib/docker');

const SUSPEND_CHECK_INTERVAL_MS = 60 * 60 * 1000; // check hourly

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    for (const guild of client.guilds.cache.values()) {
      try {
        const invites = await guild.invites.fetch();
        const map = {};
        invites.forEach(inv => { map[inv.code] = inv.uses || 0; });
        setGuildInviteUses(guild.id, map);
      } catch (err) {
        console.warn(`Could not fetch invites for ${guild.name}: ${err.message}`);
      }
    }

    // Catch anything that expired while the bot was offline, then keep checking hourly
    checkAndSuspendExpiredContainers().catch(err => console.error('VPS suspend check failed:', err));
    setInterval(() => {
      checkAndSuspendExpiredContainers().catch(err => console.error('VPS suspend check failed:', err));
    }, SUSPEND_CHECK_INTERVAL_MS);
  },
};
