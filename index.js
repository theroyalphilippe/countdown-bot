const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require("@discordjs/voice");
const googleTTS = require("google-tts-api");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log("✅ Bot is online!");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "countdown") {
    const seconds = interaction.options.getInteger("seconds");
    const channel = interaction.member.voice.channel;

    if (!channel) {
      return interaction.reply("❌ Join a voice channel first.");
    }

    await interaction.reply(`⏱️ Countdown starting: ${seconds}s`);
    playCountdown(channel, seconds);
  }
});

async function playCountdown(voiceChannel, seconds) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  const player = createAudioPlayer();
  connection.subscribe(player);

  for (let i = seconds; i >= 1; i--) {
    const url = googleTTS.getAudioUrl(i.toString(), { lang: "en" });
    const resource = createAudioResource(url);
    player.play(resource);

    await new Promise(resolve => {
      player.once(AudioPlayerStatus.Idle, resolve);
    });
  }

  connection.destroy();
}

client.login(process.env.DISCORD_TOKEN);
