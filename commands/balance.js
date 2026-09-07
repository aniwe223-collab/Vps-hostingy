const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your (or someone else\'s) coin balance')
    .addUserOption(opt =>
      opt.setName('user').setDescription('Whose balance to check').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const bal = getBalance(target.id);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setDescription(`💰 **${target.username}** has **${bal} coins**.`);

    await interaction.reply({ embeds: [embed] });
  },
};
