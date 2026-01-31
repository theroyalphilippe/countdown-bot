const fs = require("fs");
const path = require("path");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const googleTTS = require("google-tts-api");

const ffmpegPath = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpegPath;

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
  if (interaction.commandName !== "countdown") return;

  const seconds = interaction.options.getInteger("seconds");
  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    return interaction.reply({
      content: "❌ Join a voice channel first.",
      ephemeral: true
    });
  }

  // 🔥 REQUIRED to avoid timeout
  await interaction.deferReply();

  try {
    await interaction.editReply(`⏱️ Countdown starting: ${seconds}s`);
    await playCountdown(voiceChannel, seconds);
  } catch (err) {
    console.error("❌ Countdown failed:", err);
    await interaction.editReply("❌ Audio playback failed. Check Railway logs.");
  }
});

async function playCountdown(voiceChannel, seconds) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

  const player = createAudioPlayer();
  connection.subscribe(player);

  for (let i = seconds; i >= 1; i--) {
    const url = googleTTS.getAudioUrl(String(i), {
      lang: "en",
      slow: false
    });

    const filePath = path.join(
      process.cwd(),
      `tts_${i}_${Date.now()}.mp3`
    );

    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const resource = createAudioResource(filePath);
    player.play(resource);

    await entersState(player, AudioPlayerStatus.Playing, 10_000);
    await new Promise(resolve =>
      player.once(AudioPlayerStatus.Idle, resolve)
    );

    fs.unlinkSync(filePath);
  }

  connection.destroy();
}

client.login(process.env.DISCORD_TOKEN);
