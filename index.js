const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

const googleTTS = require("google-tts-api");
const play = require("play-dl");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once("ready", () => console.log("✅ Bot is online!"));

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "countdown") return;

  const seconds = interaction.options.getInteger("seconds");
  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    return interaction.reply("❌ Join a voice channel first.");
  }

  await interaction.reply(`⏱️ Countdown starting: ${seconds}s`);

  playCountdown(voiceChannel, seconds).catch((e) => {
    console.error("Countdown error:", e);
  });
});

async function playCountdown(voiceChannel, seconds) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

  const player = createAudioPlayer();
  connection.subscribe(player);

  for (let i = seconds; i >= 1; i--) {
    const url = googleTTS.getAudioUrl(String(i), { lang: "en", slow: false });

    const stream = await play.stream(url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    player.play(resource);

    // wait until audio starts + finishes
    await entersState(player, AudioPlayerStatus.Playing, 10_000);
    await new Promise((resolve) => player.once(AudioPlayerStatus.Idle, resolve));
  }

  connection.destroy();
}

client.login(process.env.DISCORD_TOKEN);
