const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("countdown")
    .setDescription("Start a voice countdown")
    .addIntegerOption((opt) =>
      opt
        .setName("seconds")
        .setDescription("How many seconds?")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(60)
    ),
].map((c) => c.toJSON());

const token = process.env.DISCORD_TOKEN;
const appId = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;

if (!token || !appId) {
  console.log("⚠️ Missing DISCORD_TOKEN or APPLICATION_ID in Railway Variables.");
  process.exit(0); // don’t crash the whole service
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(appId, guildId), {
        body: commands,
      });
      console.log("✅ Slash commands deployed (GUILD)");
    } else {
      await rest.put(Routes.applicationCommands(appId), { body: commands });
      console.log("✅ Slash commands deployed (GLOBAL)");
    }
  } catch (err) {
    console.error("❌ Failed to deploy slash commands:", err);
  }
})();
