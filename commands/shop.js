const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SHOP } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('See what you can buy with your coins'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🛒 Shop')
      .setDescription(
        SHOP.map(item => `**${item.name}** — ${item.cost} coins\n${item.description} (\`/buy item:${item.id}\`)`).join('\n\n')
      );

    await interaction.reply({ embeds: [embed] });
  },
};
