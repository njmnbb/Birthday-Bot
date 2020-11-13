const config = require('./config.json');
const Discord = require('discord.js');
const bot = new Discord.Client();
const https = require('https');
const ytdl = require('ytdl-core');
const fs = require('fs');

bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.username} #${bot.user.discriminator}`); 
});

bot.on('guildCreate', (guild) => {
	let defaultTextChannel = guild.channels.cache.find(channel => channel.name === 'general');
	defaultTextChannel.send('**Thanks for adding Birthday-Bot!**\n\n- Start by joining a voice channel and typing `!birthday [name]` to try out the bot\n- List of commands can be found by typing `!birthday help`')
});

bot.on('message', (msg) => {
	var args = msg.content.replace(/\s+/g, ' ').split(' ', 2);
	var voiceChannel = msg.member.voice.channel;
	var textChannel = msg.channel;
	var name = args[1];
	
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
	if(args[0] !== '!birthday' || args[1] === undefined) return;

	// If user says stop, leave voice channel to stop song
	if(name === 'stop' && voiceChannel != undefined) {
		voiceChannel.leave();
		return;
	}

	if(name === 'help') {
		textChannel.send('`!birthday [name]`: Searches the 1HappyBirthday channel for a song that matches the name entered\n`!birthday stop`: Stops the current song, if one is playing, and leaves the voice channel');

		return;
	}

	// Checking if user is in a voice channel
	if(voiceChannel === null) {
		textChannel.send(msg.member.user.toString() + ' Please join a voice channel');
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
	var streamOptions = { seek: 0, volume: 0.3 };

	voiceChannel.join()
		.then(connection => {
			if(videoId !== undefined) {
				const stream = ytdl(url, {filter : 'audioonly'});
				const dispatcher = connection.play(stream, streamOptions);

				dispatcher.on('finish', () => voiceChannel.leave());
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
