require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (process.env.GUILD_ID) {
      // Instant update, only visible in this one server - best while testing
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
      console.log(`Registered ${commands.length} commands to guild ${process.env.GUILD_ID}.`);
    } else {
      // Global update - can take up to an hour to propagate, works in all servers
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      console.log(`Registered ${commands.length} global commands.`);
    }
  } catch (err) {
    console.error(err);
  }
})();
