const { COINS_PER_INVITE } = require('../config');
const { getGuildInviteUses, setGuildInviteUses, addCoins, setInviter } = require('../database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guild = member.guild;

    // Bots joining via invite shouldn't earn coins for anyone
    if (member.user.bot) return;

    let newInvites;
    try {
      newInvites = await guild.invites.fetch();
    } catch (err) {
      console.warn(`Could not fetch invites after join: ${err.message}`);
      return;
    }

    const oldUses = getGuildInviteUses(guild.id); // { code: usesBefore }
    const newMap = {};
    let usedInvite = null;

    newInvites.forEach(inv => {
      newMap[inv.code] = inv.uses || 0;
      const before = oldUses[inv.code] || 0;
      if (!usedInvite && (inv.uses || 0) > before) {
        usedInvite = inv;
      }
    });

    // Update the cache for next time (always, even if we couldn't identify the invite,
    // e.g. it could have been a vanity URL invite which has no "uses" count).
    setGuildInviteUses(guild.id, newMap);

    if (!usedInvite || !usedInvite.inviter) {
      console.log(`${member.user.tag} joined ${guild.name}, but the invite used could not be determined.`);
      return;
    }

    const inviterId = usedInvite.inviter.id;

    // Optional anti-abuse: don't pay someone for "inviting" themselves
    if (inviterId === member.id) return;

    setInviter(member.id, inviterId);
    const newBalance = addCoins(inviterId, COINS_PER_INVITE);

    console.log(`${member.user.tag} joined using ${usedInvite.inviter.tag}'s invite (+${COINS_PER_INVITE} coins, new balance ${newBalance}).`);

    // Optional: DM the inviter or post in a channel. Example (uncomment to use):
    // const channel = guild.systemChannel;
    // if (channel) channel.send(`🎉 ${usedInvite.inviter} earned **${COINS_PER_INVITE} coins** for inviting ${member}!`);
  },
};
