const config = require('./config.json');

const Discord = require('discord.js');
const bot = new Discord.Client();
const https = require('https');
const ytdl = require('ytdl-core');

bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.username} #${bot.user.discriminator}`);
});

bot.on('message', (msg) => {
	var args = msg.content.replace(/\s+/g, ' ').split(' ', 2);
	var voiceChannel = msg.member.voiceChannel;
	var textChannel = msg.channel;
	var name = args[1];

	// If user says stop, leave voice channel to stop video
	if(name === 'stop') {
		voiceChannel.leave();
		return;
	}

	// Checking for valid args
	if(args[0] !== '!birthday') return;

	// Checking if user is in a voice channel
	if(voiceChannel === undefined) {
		textChannel.sendMessage('Please join a voice channel');
		console.log('Join a voice channel');
		return;
	}

	// If no errors, search YouTube for video
	getVideoId(voiceChannel, name);
});

bot.login(config.token);

/************
* FUNCTIONS
*************/

function playSound(voiceChannel, videoId) {
	var url = 'http://youtube.com/watch?v=' + videoId;
	var streamOptions = { seek: 0, volume: 1 };

	voiceChannel.join()
		.then(connection => {
			if(videoId !== undefined) {
				const stream = ytdl(url, {filter : 'audioonly'});
				const dispatcher = connection.playStream(stream, streamOptions);

				dispatcher.on('end', () => voiceChannel.leave());
			}
		})
		.catch(console.error);
}


function getVideoId(voiceChannel, name) {
	var videoId = '';
	var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCIJ5p0TQwRyBgdq6Wb7D_gA&maxResults=1&q=' + name + '&type=video&key=' + config.key;

	https.get(url, (res) => {

		res.on('data', (data) => {
			videoId += data;
		});

		res.on('end', () => {
			try {
				videoId = JSON.parse(videoId).items[0].id.videoId;
			}
			catch(error) {
				textChannel.sendMessage('Sorry, your name was not found');
				console.log('Sorry, no name found');
				return;
			}

			playSound(voiceChannel, videoId);
		});

	}).on('error', (error) => {
		console.log(error);
	});
}
