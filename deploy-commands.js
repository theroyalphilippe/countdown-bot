const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("countdown")
    .setDescription("Start a voice countdown")
    .addIntegerOption(option =>
      option
        .setName("seconds")
        .setDescription("Number of seconds")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(60)
    )
].map(cmd => cmd.toJSON());

const token = process.env.DISCORD_TOKEN;
const appId = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;

if (!token || !appId || !guildId) {
  console.error("❌ Missing DISCORD_TOKEN, APPLICATION_ID or GUILD_ID");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(appId, guildId),
      { body: commands }
    );
    console.log("✅ Slash commands deployed (GUILD)");
  } catch (error) {
    console.error(error);
  }
})();
