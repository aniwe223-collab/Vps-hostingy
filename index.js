require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,  // must also be enabled in the Dev Portal (Privileged Gateway Intents)
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // must also be enabled in the Dev Portal (Privileged Gateway Intents) - needed to read "!c"
  ],
});

client.commands = new Collection();

// Load slash commands from ./commands
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// Load events from ./events
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    const reply = { content: 'Something went wrong running that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  }
});

client.login(process.env.DISCORD_TOKEN);
