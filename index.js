const commando = require('discord.js-commando');
const bot = new commando.Client();

bot.registry.registerGroup('random', 'Random');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + "/commands");


bot.on("guildMemberAdd", member => {
    let guild = member.guild;
    guild.defaultChannel.sendMessage(`Welcome ${member.user} to the Steemit Philippines Server.  Please check out the FAQ channel for documentation and support to help you get started.  Please also make sure to visit the Registration Channel to Register!`).catch(console.error);
  });

bot.on('message', (message) => {
    
        if(message.content == 'hello') {
            message.reply('Hello!  I Hope you are having a good day!');
        }
    
        if(message.content == 'Hello') {
            message.reply('Hello!  I Hope you are having a good day!');
        }
    
        if(message.content == 'How are You') {
            message.reply('Im Great now that you are here!');
        }
    
        if(message.content == 'Kamusta') {
            message.reply('Okay naman ako!');
        }

    });
           

bot.login('Your Bot Token');


const commando = require('discord.js-commando');
const bot = new commando.Client();
const ytdl = require('ytdl-core');
const request = require('request');
const fs = require('fs');
const getYouTubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");

var config = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));

const yt_api_key = config.yt_api_key;
const bot_controller = config.bot_controller;
const prefix = config.prefix;
const discord_token = config.discord_token;

var queue =[];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];

bot.registry.registerGroup('random', 'Random');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + "/commands");


bot.on('message', function (message) {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(" ");

    if (mess.startsWith(prefix + "play")) {
        if (member.voiceChannel || bot.guilds.get("").voiceConnection != null) {
            if (queue.length > 0 || isPlaying) {
                getID(args, function (id) {
                    add_to_queue(id)
                    fetchVideoInfo(id, function (err, videoInfo) {
                        if (err) throw new Error(err);
                        message.reply(" added to queue: **" + videoInfo.title + "**");
                    });
                });
            } else {
                isPlaying = true;
                getID(args, function (id) {
                    queue.push("placeholder");
                    playMusic(id, message);
                    fetchVideoInfo(id, function (err, videoInfo) {
                        if (err) throw new Error(err);
                        message.reply(" now playing: **" + videoInfo.title + "**");
                    });
                });
            }
        } else {
            message.reply(" you need to be in a voice channel!");
        }
    } else if (mess.startsWith(prefix + "skip")) {
        if (skippers.indexOf(message.author.id) === -1) {
            skippers.push(message.author.id);
            skipReq++;
            if (skipReq >= Math.ceil((voiceChannel.members.size - 1) /2)) {
                skip_song(message);
                message.reply(" your skip request has been acknowledged. Skipping now!");
            } else {
                message.reply(" your skip request has been acknowledged, You need **" + Math.ceil((voiceChannel.members.size - 1) / 2) - skipReq) + "** more skip votes";
            }
        } else {
            message.reply(" you already voted to skip!");
        }
    }

});


bot.on("guildMemberAdd", member => {
    let guild = member.guild;
    guild.defaultChannel.sendMessage(`Welcome ${member.user} to the Steemit Philippines Server.  Please check out the FAQ channel for documentation and support to help you get started.  Please also make sure to visit the Registration Channel to Register!`).catch(console.error);
  });

bot.on('message', (message) => {
    
        if(message.content == 'hello') {
            message.reply('Hello!  I Hope you are having a good day!');
        }
    
        if(message.content == 'Hello') {
            message.reply('Hello!  I Hope you are having a good day!');
        }
    
        if(message.content == 'How are You') {
            message.reply('Im Great now that you are here!');
        }
    
        if(message.content == 'Kamusta') {
            message.reply('Okay naman ako!');
        }

    });
           




bot.login(discord_token);

bot.on('ready', function () {
    console.log("I am ready!");
});

function skip_song(message) {
    dispatcher.end();
    if (queue.length > 1) {
        playMusic(queue[0]. message);
    } else {
        skipReq = 0;
        skippers = [];
    }
}

function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;

    voiceChannel.join().then(function (connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: 'audioonly'
        });
        skipReq = 0;
        skippers =[];

        dispatcher = connection.playStream(stream);
        dispatcher.on('end', function () {
            skipReq = 0;
            skippers = [];
            queue.shift();
            if (queue.length === 0) {
                queue = [];
                isPlaying = false;
            } else {
                playMusic(queue[0], message);
            }
        });
    });
}

function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYouTubeID(str));
    } else {
        search_video(str, function (id) {
            cb(id);
        });
    }
}

function add_to_queue(strID) {
    if (isYoutube(strID)) {
        queue.push(YouTubeID(strID));
    } else {
        queue.push(strID);
    }
}


function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        callback(json.items[0].id.videoId);
    });
}

function isYoutube(str) {
    return str.toLowerCase().indexOf("youtube.com") > -1;
}
