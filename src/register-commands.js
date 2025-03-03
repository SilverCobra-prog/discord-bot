import { config } from 'dotenv';
import { REST, Routes, Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';  

config();

// Create OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  
});

const commands = [
  {
    name: 'wiki',
    description: 'Get a summary of a Wikipedia page',
    options: [
      {
        name: 'query',
        type: 3, 
        description: 'Search term for Wikipedia',
        required: true,
      },
    ],
  },
  {
    name: 'summarize', 
    description: 'Summarize a Wikipedia page using GPT-3.5',
    options: [
      {
        name: 'query',
        type: 3, 
        description: 'Search term for Wikipedia',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('Slash commands were registered successfully!');
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'wiki') {
    const query = interaction.options.getString('query');
    const formattedQuery = encodeURIComponent(query);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedQuery}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Page not found');
      }
      const data = await response.json();

      if (data.type === 'disambiguation') {
        await interaction.reply("Your query is ambiguous. Please be more specific.");
      } else if (!data.extract) {
        await interaction.reply("Sorry, I couldn't find a summary for that page.");
      } else {
        const reply = `**${data.title}**\n\n${data.extract}\n\nRead more: ${data.content_urls.desktop.page}`;
        await interaction.reply(reply);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply("Sorry, I couldn't fetch that Wikipedia page.");
    }
  }

  if (commandName === 'summarize') {
    const query = interaction.options.getString('query');
    const formattedQuery = encodeURIComponent(query);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedQuery}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Page not found');
      }
      const data = await response.json();

      if (data.type === 'disambiguation') {
        await interaction.reply("Your query is ambiguous. Please be more specific.");
      } else if (!data.extract) {
        await interaction.reply("Sorry, I couldn't find a summary for that page.");
      } else {
        const gpt3Summary = await openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides concise summaries.',
            },
            {
              role: 'user',
              content: `Summarize the following text: ${data.extract}`,
            },
          ],
          model: 'gpt-3.5-turbo',
          max_tokens: 150,  // You can adjust the length of the summary here
        });

        const reply = `**${data.title}**\n\n${gpt3Summary.choices[0].message.content}\n\nRead more: ${data.content_urls.desktop.page}`;
        await interaction.reply(reply);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply("Sorry, I couldn't fetch or summarize that Wikipedia page.");
    }
  }
});

client.login(process.env.TOKEN);
