const config = require('./config.json');
const Discord = require('discord.js');
const bot = new Discord.Client();
const https = require('https');
const ytdl = require('ytdl-core');
const fs = require('fs');

bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.username} #${bot.user.discriminator}`);
});

bot.on('message', (msg) => {
	var args = msg.content.replace(/\s+/g, ' ').split(' ', 2);
	var voiceChannel = msg.member.voiceChannel;
	var textChannel = msg.channel;
	
	var prefix = '!birthday';
	var name = args[1];

	process.on('uncaughtException', function (e) {
  		fs.appendFile(	'err.log', 
				'Error occured on ' + new Date().toString()  + ':\n' + e + '\n' + console.trace() + '\n\n-----------------------------------------------------------------\n\n'
				, function (err) {
  			if (err) throw err;
  			console.log('Saved!');
			process.exit(1);
		});
  		
	});

	// Checking for valid args
	if(args[0] != prefix) return;
        if(name === undefined) return;

	// If user says stop, leave voice channel to stop song
	if(name === 'stop' && voiceChannel != undefined) {
		voiceChannel.leave();
		return;
	}

	// If bot is already playing a song, don't interrupt song
//	if(name !== 'stop' && voiceChannel != undefined) {
//		textChannel.sendMessage(msg.member.user.toString() + ' Wait for the song to end or stop the song by using the command \'!birthday stop\'');
//		return;
//	}

	// Checking if user is in a voice channel
	if(voiceChannel === undefined) {
		textChannel.sendMessage(msg.member.user.toString() + ' Please join a voice channel');
		return;
	}

	// If no errors, search YouTube for video
	getVideoId(voiceChannel, textChannel, name.toLowerCase());

});

bot.login(config.token);

/************
* FUNCTIONS
*************/

function playSound(voiceChannel, videoId) {
	const url = 'http://youtube.com/watch?v=' + videoId;
	var streamOptions = { seek: 0, volume: 1 };

	voiceChannel.join()
		.then(connection => {
			if(videoId !== undefined) {
				const stream = ytdl(url, {filter : 'audioonly'});
				const dispatcher = connection.playStream(stream, streamOptions);
				console.log('Got here');
				dispatcher.on('end', () => voiceChannel.leave());
			}
		})
		.catch(console.error);
}


function getVideoId(voiceChannel, textChannel, name) {
	var vidId = '';
	var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCIJ5p0TQwRyBgdq6Wb7D_gA&maxResults=5&q=' + name + '&type=video&key=' + config.key;
	var titles = '';

	// Using YouTube API to search 1HappyBirthday's channel for the appropriate video
	https.get(url, (res) => {

		res.on('data', (data) => {
			vidId += data;
		});

		res.on('end', () => {

			// Checking if name entered is in the title of any of the returned videos 
			titles = JSON.parse(vidId).items;
			for(var i = 0 in titles) {
				console.log(titles[i].snippet.title.toLowerCase());
				
				// If no errors, play birthday song
				if(titles[i].snippet.title.toLowerCase().indexOf(name) > -1) {
					vidId = JSON.parse(vidId).items[i].id.videoId;
					playSound(voiceChannel, vidId);
					return;
				}
			}

			// If name is not in the search results, error message
			textChannel.sendMessage('Sorry, your name was not found');
			return;

		});

	}).on('error', (error) => {
		console.log(error);
	});
}
