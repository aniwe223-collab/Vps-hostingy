const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SHOP, VIP_ROLE_ID } = require('../config');
const { removeCoins, addItem } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Which item to buy')
        .setRequired(true)
        .addChoices(...SHOP.map(i => ({ name: `${i.name} (${i.cost} coins)`, value: i.id })))),

  async execute(interaction) {
    const itemId = interaction.options.getString('item');
    const item = SHOP.find(i => i.id === itemId);

    if (!item) {
      return interaction.reply({ content: 'That item does not exist.', ephemeral: true });
    }

    const newBalance = removeCoins(interaction.user.id, item.cost);

    if (newBalance === null) {
      return interaction.reply({
        content: `You don't have enough coins for **${item.name}** (costs ${item.cost}).`,
        ephemeral: true,
      });
    }

    addItem(interaction.user.id, item.id);

    // Example of an item that actually does something beyond sitting in inventory
    if (item.id === 'vip_role' && VIP_ROLE_ID) {
      try {
        await interaction.member.roles.add(VIP_ROLE_ID);
      } catch (err) {
        console.warn(`Could not add VIP role: ${err.message}`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setDescription(`✅ You bought **${item.name}** for ${item.cost} coins.\nNew balance: **${newBalance} coins**.`);

    await interaction.reply({ embeds: [embed] });
  },
};
