import { config } from 'dotenv';
import { Client, IntentsBitField } from 'discord.js';  

config();  
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', (c) => {
  console.log(`✅ ${c.user.tag} is online.`);
});

client.on('interactionCreate', (interaction) => {
  if (!interaction.isChatInputCommand()) return;
});

client.login(process.env.TOKEN);