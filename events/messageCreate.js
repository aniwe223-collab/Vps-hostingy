const { PREFIX, VPS_DEPLOY, DOCKER } = require('../config');
const { getBalance, getInviteCount, removeCoins, addCoins, getContainerInfo } = require('../database');
const { createUserContainer } = require('../lib/docker');

function formatVpsDetails(info) {
  return (
    `🖥️ **Your VPS connection details:**\n` +
    `Host: \`${DOCKER.SSH_HOST}\`\n` +
    `Port: \`${info.port}\`\n` +
    `Username: \`root\`\n` +
    `Password: \`${info.password}\`\n\n` +
    `Connect with:\n\`ssh root@${DOCKER.SSH_HOST} -p ${info.port}\``
  );
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots (including this bot itself) and anything not starting with the prefix
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    // !c  -> show your own balance (or someone else's: !c @user)
    if (cmd === 'c') {
      const target = message.mentions.users.first() || message.author;
      const bal = getBalance(target.id);
      await message.reply(`💰 **${target.username}** has **${bal} coins**.`);
    }

    // !i  -> show your invite count and coin balance (or someone else's: !i @user)
    if (cmd === 'i') {
      const target = message.mentions.users.first() || message.author;
      const invites = getInviteCount(target.id);
      const bal = getBalance(target.id);
      await message.reply(`📨 **${target.username}** has invited **${invites}** member(s) and has **${bal} coins**.`);
    }

    // !deploy vps  -> requires REQUIRED_INVITES invites + COST coins, then spins up a real Docker container
    if (cmd === 'deploy' && args[0]?.toLowerCase() === 'vps') {
      const existing = getContainerInfo(message.author.id);
      if (existing) {
        if (existing.suspended) {
          await message.reply(
            `⚠️ Your VPS was auto-suspended after ${DOCKER.SUSPEND_AFTER_DAYS} days and is no longer running. ` +
            `Contact a server admin if you need it reactivated.`
          );
        } else {
          await message.reply(`ℹ️ You already have a VPS. Use \`${PREFIX}myvps\` to get your details again.`);
        }
        return;
      }

      const invites = getInviteCount(message.author.id);
      const bal = getBalance(message.author.id);

      if (invites < VPS_DEPLOY.REQUIRED_INVITES) {
        await message.reply(
          `❌ You need **${VPS_DEPLOY.REQUIRED_INVITES}** invites to deploy a VPS. You currently have **${invites}**.`
        );
        return;
      }

      if (bal < VPS_DEPLOY.COST) {
        await message.reply(
          `❌ You need **${VPS_DEPLOY.COST} coins** to deploy a VPS. You currently have **${bal}**.`
        );
        return;
      }

      const newBalance = removeCoins(message.author.id, VPS_DEPLOY.COST);
      if (newBalance === null) {
        // Race condition safety net: balance changed between the check above and now
        await message.reply('❌ Something changed with your balance — please try again.');
        return;
      }

      await message.reply('⏳ Spinning up your VPS... this can take a few seconds.');

      let info;
      try {
        info = await createUserContainer(message.author.id);
      } catch (err) {
        addCoins(message.author.id, VPS_DEPLOY.COST); // refund since nothing was actually created
        console.error('VPS creation failed:', err);
        await message.reply(`❌ Couldn't create your VPS (coins refunded): ${err.message}`);
        return;
      }

      try {
        await message.author.send(formatVpsDetails(info));
        await message.reply(`✅ VPS deployed! Check your DMs for connection details. New balance: **${newBalance} coins**.`);
      } catch (err) {
        await message.reply(
          `⚠️ Your VPS was created, but I couldn't DM you the details (check your privacy settings allow DMs from this server). ` +
          `Use \`${PREFIX}myvps\` once that's fixed to get them.`
        );
      }
    }

    // !myvps  -> re-sends your existing VPS connection details via DM
    if (cmd === 'myvps') {
      const info = getContainerInfo(message.author.id);
      if (!info) {
        await message.reply(`ℹ️ You don't have a VPS yet. Use \`${PREFIX}deploy vps\` once you qualify.`);
        return;
      }
      if (info.suspended) {
        await message.reply(`⚠️ Your VPS was auto-suspended after ${DOCKER.SUSPEND_AFTER_DAYS} days and is no longer running.`);
        return;
      }
      try {
        await message.author.send(formatVpsDetails(info));
        await message.reply('📬 Sent your VPS details to your DMs.');
      } catch (err) {
        await message.reply("⚠️ Couldn't DM you — check your privacy settings allow DMs from this server.");
      }
    }
  },
};
