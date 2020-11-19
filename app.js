const {prefix, token, youtubeApiKey} = require('./config.json');
const Discord = require('discord.js');
const bot = new Discord.Client();
const https = require('https');
const ytdl = require('ytdl-core');
const fs = require('fs');

bot.on('ready', () => {
	bot.user.setPresence({
		activity: {
			name: 'Shrek videos',
			type: 'STREAMING',
			url: 'https://www.youtube.com/watch?v=GYcPeH6IY9A'
		},
		status: 'online'
	});
});

bot.on('guildCreate', (guild) => {
	let defaultTextChannel = guild.channels.cache.find(channel => channel.name === 'general');
	defaultTextChannel.send('**Thanks for adding Birthday-Bot!**\n\n- Start by joining a voice channel and typing `!birthday [name]` to try out the bot\n- List of commands can be found by typing `!birthday help`')
});

bot.on('message', (msg) => {
	let args = msg.content.replace(/\s+/g, ' ').split(' ', 2);
	let voiceChannel = msg.member.voice.channel;
	let textChannel = msg.channel;
	let command = args[0];
	let name = args[1];
	
	// Error logging with timestamp
	process.on('uncaughtException', function (e) {
  		fs.appendFile('err.log', 
				'Error occured on ' + new Date().toString()  + ':\n' + e + '\n' + console.trace() + '\n\n-----------------------------------------------------------------\n\n'
				, function (err) {
					if (err) throw err;
					console.log('Saved!');
					process.exit(1);
		});	
	});
	
	// Checking for valid args
	if(command === `${prefix}birthday` && name !== undefined) {

		// If user says stop, leave voice channel to stop song
		if(name === 'stop' && voiceChannel != undefined) {
			voiceChannel.leave();
			return;
		} else if(name === 'help') {
			textChannel.send('`!birthday [name]`: Searches the 1HappyBirthday channel for a song that matches the name entered\n`!birthday stop`: Stops the current song, if one is playing, and leaves the voice channel');
			return;
		} else if(voiceChannel === null) {
			textChannel.send(msg.member.user.toString() + ' Please join a voice channel');
			return;
		} else {
			// If no errors, search YouTube for video
			getVideoId(voiceChannel, textChannel, name.toLowerCase());
		}
	}

});

bot.login(token);

/************
* FUNCTIONS
*************/

function playSound(voiceChannel, videoId) {
	const url = 'http://youtube.com/watch?v=' + videoId;
	let streamOptions = { seek: 0, volume: 0.2, bitrate: 'auto' };

	voiceChannel.join()
		.then(connection => {
			if(videoId !== undefined) {
				const stream = ytdl(url, {filter: 'audioonly', quality: 'lowest'});
				const dispatcher = connection.play(stream, streamOptions);

				dispatcher.on('finish', () => voiceChannel.leave());
			}
		})
		.catch(console.error);
}


function getVideoId(voiceChannel, textChannel, name) {
	let vidId = '';
	let url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCIJ5p0TQwRyBgdq6Wb7D_gA&maxResults=5&q=' + name + '&type=video&key=' + youtubeApiKey;
	let titles = '';

	// Using YouTube API to search 1HappyBirthday's channel for the appropriate video
	https.get(url, (res) => {

		res.on('data', (data) => {
			vidId += data;
		});

		res.on('end', () => {

			// Checking if name entered is in the title of any of the returned videos 
			titles = JSON.parse(vidId).items;
			
			for(var i = 0 in titles) {
				if(titles[i].snippet.title.toLowerCase().indexOf(name) > -1) {
					// If no errors, play sound clip
					vidId = JSON.parse(vidId).items[0].id.videoId;
					playSound(voiceChannel, vidId);
					return;
				}
			}			

			// If name is not in the search results, error message
			textChannel.send('Sorry, your name was not found');
			return;
		});

	}).on('error', (error) => {
		console.log(error);
	});
}
