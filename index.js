const commando = require('discord.js-commando');
const bot = new commando.Client();
const ytdl = require('ytdl-core');
const request = require('request');
const fs = require('fs');
const getYouTubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");
const utils = require('./utils');
const Discordie = require('discordie');
const client = new Discordie({autoReconnect: true});
const Events = Discordie.Events;
const steem = require("steem");

var config = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));

const yt_api_key = config.yt_api_key;
const bot_controller = config.bot_controller;
const prefix = config.prefix;
const discord_token = config.discord_token;


Number.prototype.formatMoney = function(c, d, t){
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

client.connect({
    token: config.discord_token
});
client.Dispatcher.on(Events.GATEWAY_READY, function (e) {
    console.log('Connected as: ' + client.User.username);
    if (client.User.gameName !== "with STEEM") {
        client.User.setGame({name:"with STEEM", type:0});
    }
});



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
        if (member.voiceChannel || bot.guilds.get("343789614735032320").voiceConnection != null) {
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
    guild.defaultChannel.send(`Welcome ${member.user} to the Steemit Philippines Server.  Please check out the GUIDEBOOK channels for documentation and support to help you get started.  Please also make sure to visit the Registration Channel to Register!`).catch(console.error);
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
           



client.Dispatcher.on("MESSAGE_CREATE", function (e) {
        content = e.message.content;
        console.log(e.message.author.username +': ' + content)
        if (content.startsWith("!steem")) {
            var args = content.replace("!steem", "").trim().split(" ");
            if (args.length === 1) {
                e.message.channel.sendTyping();
                utils.getProfileData(args[0]).then(function (profile) {
                    if (profile.length === 1) {

                        utils.getFollowerCount(profile[0].name).then(function (result) {
                            profile[0].follower = result.follower_count;
                            profile[0].following = result.following_count;

                            steem.api.getDynamicGlobalProperties((err, result) => {

                                profile[0].steempower = parseFloat(result.total_vesting_fund_steem) * (parseFloat(profile[0].vesting_shares) / parseFloat(result.total_vesting_shares));
                                
                                steem.formatter.estimateAccountValue(profile[0]).then(function (r) {
                                    profile[0].valueUSD = parseFloat(r).formatMoney(2);
                                    profile[0].balance = parseFloat(profile[0].balance).formatMoney(2);
                                    profile[0].steempower = parseFloat(profile[0].steempower).formatMoney(2);
                                    profile = utils.getEmbedProfile(profile[0]);

                                    e.message.channel.sendMessage("", [], false, profile);
                                })

                            });


                        }).catch(function (e) {
                            console.log(e);
                        });

                    }
                }).catch(function (e) {
                    console.log(e);
                });
            }
        }
        if (content.startsWith("!help")) {
            e.message.channel.sendMessage("Hi! I'm KuyaBot, a bot created to support Steemit Philippines | SteemPH. If you have any questions, please feel free to contact @cloh76");
        }

        if (content.startsWith("!new")) {
            const params = content.replace("!new ", "").split(' ');
            const tag = params[0];
            const limit = params.length > 1 ? parseInt(params[1]) : 1;
            e.message.channel.sendTyping();
            utils.getDiscussionByCreated(tag, limit).then(function (result) {
                if (result.length === 0) {
                    e.message.channel.sendMessage("I can't find posts matching your search.");
                } else {
                    for (var i = 0; i < result.length; i++) {
                        var link = utils.printLink(result[i]);
                        e.message.channel.sendMessage("", [], false, link);
                    }
                }
            }).catch(function (e) {
                console.log(e);
            })

        }
        if (content.startsWith("!hot")) {
            const params = content.replace("!hot ", "").split(' ');
            const tag = params[0];
            const limit = params.length > 1 ? parseInt(params[1]) : 1;
            e.message.channel.sendTyping();
            utils.getDiscussionsByHot(tag, limit).then(function (result) {
                if (result.length === 0) {
                    e.message.channel.sendMessage("I can't find posts matching your search.");
                } else {
                    for (var i = 0; i < result.length; i++) {
                        var link = utils.printLink(result[i]);
                        e.message.channel.sendMessage("", [], false, link);
                    }
                }

            }).catch(function (e) {
                console.log(e);
            })
        }
        if (content.startsWith("!trend")) {
            const params = content.replace("!trend ", "").split(' ');
            const tag = params[0];
            const limit = params.length > 1 ? parseInt(params[1]) : 1;
            e.message.channel.sendTyping();
            utils.getDiscussionsByTrending(tag, limit).then(function (result) {
                if (result.length === 0) {
                    e.message.channel.sendMessage("I can't find posts matching your search.");
                } else {
                    for (var i = 0; i < result.length; i++) {
                        var link = utils.printLink(result[i]);
                        e.message.channel.sendMessage("", [], false, link);
                    }
                }
            }).catch(function (e) {
                console.log(e);
            })
        }

    }
);


setInterval(function () {
    steem.api.getFollowCount("wehmoen", function (err, result) {

    });
}, 1000);    




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
