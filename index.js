const fs = require("fs");
const path = require("path");

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

// Make sure ffmpeg is available on Railway
const ffmpegPath = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpegPath;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once("ready", () => {
  console.log("✅ Bot is online!");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "countdown") return;

  const seconds = interaction.options.getInteger("seconds");
  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply("❌ Join a voice channel first.");
  }

  await interaction.reply(`⏱️ Countdown starting: ${seconds}s`);

  try {
    await playCountdown(voiceChannel, seconds);
  } catch (err) {
    console.error("❌ Countdown error:", err);
    // Don’t crash; just inform user
    try {
      await interaction.followUp("❌ Something went wrong playing audio. Check Railway Logs.");
    } catch {}
  }
});

async function playCountdown(voiceChannel, seconds) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  connection.on("error", (e) => console.error("Voice connection error:", e));

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

  const player = createAudioPlayer();
  player.on("error", (e) => console.error("Audio player error:", e));
  connection.subscribe(player);

  // Small helper: download mp3 to a temp file
  async function downloadToFile(url, filePath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TTS download failed: ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buf);
  }

  try {
    for (let i = seconds; i >= 1; i--) {
      const ttsUrl = googleTTS.getAudioUrl(String(i), { lang: "en", slow: false });
      const filePath = path.join(process.cwd(), `count_${i}_${Date.now()}.mp3`);

      await downloadToFile(ttsUrl, filePath);

      const resource = createAudioResource(filePath, { inlineVolume: true });
      resource.volume.setVolume(1.0);

      player.play(resource);

      await entersState(player, AudioPlayerStatus.Playing, 10_000);
      await new Promise((resolve) => player.once(AudioPlayerStatus.Idle, resolve));

      // cleanup
      try { fs.unlinkSync(filePath); } catch {}
    }
  } finally {
    try { connection.destroy(); } catch {}
  }
}

client.login(process.env.DISCORD_TOKEN);
