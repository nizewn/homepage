// dont judger pls :<

const token = process.env.TOKEN;
const port = process.env.PORT; // 3000?
const channelid = "1003159158415183933";

let channel;

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once("ready", c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	channel = client.channels.cache.get(channelid);
});

const { Server } = require("socket.io");
const io = new Server(port, { cors: { origin: "https://nize.ph" } });

io.on("connection", (socket) => {
	socket.on("chat", async (msg) => {
		let thread = channel.threads.cache.find(x => x.name === socket.id && x.archived === false);
		if (!thread) {
			thread = await channel.threads.create({
				name: socket.id,
				autoArchiveDuration: 60
			});
			if (thread.joinable) await thread.join();
		}
		thread.send(msg);
	});
	socket.on("disconnect", async (reason) => {
		let thread = channel.threads.cache.find(x => x.name === socket.id && x.archived === false);
		if (thread) {
			thread.send(`**Socket has disconnected.**\n\`${reason}\``);
			thread.setArchived(true);
		}
	})
});


client.on("messageCreate", message => {
	if (message.author.bot) return;

	const thread = channel.threads.cache.find(x => x.id === message.channelId);
	if (!thread) return;

	io.to(thread.name).emit("chat", message.content);
})

client.login(token);