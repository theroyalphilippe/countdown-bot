const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("countdown")
    .setDescription("Start a voice countdown")
    .addIntegerOption(option =>
      option.setName("seconds")
        .setDescription("Countdown duration")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" })
  .setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID),
      { body: commands }
    );
    console.log("✅ Slash commands deployed");
  } catch (err) {
    console.error(err);
  }
})();
