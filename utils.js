var steem = require("steem");
var time_ago = require('time_ago_in_words');
var oust = require('oust');
var h2p = require('html2plaintext');
var removeMd = require('remove-markdown');

steem.api.setOptions({ url: 'https://api.steemit.com/' });

var utils = {
    getProfileData: function (username) {
        return new Promise(function (yes, no) {
            steem.api.getAccounts([username], function (err, result) {
                if (err) no(err);
                yes(result);
            })
        })
    },
    getFollowerCount: function (username) {
        return new Promise(function (yes, no) {
            steem.api.getFollowCount(username, function (err, result) {
                if (err) no(err);
                yes(result);
            });
        })
    },
    getDiscussionByCreated: function (tag, limit) {
        return new Promise(function (yes, no) {
            steem.api.getDiscussionsByCreated({tag: tag, limit: limit}, function (err, result) {
                if (err) no(err);
                yes(result);
            });
        })
    },
    getDiscussionsByHot: function (tag, limit) {
        return new Promise(function (yes, no) {
            steem.api.getDiscussionsByHot({tag: tag, limit: limit}, function (err, result) {
                if (err) no(err);
                yes(result);
            });
        })
    },
    getDiscussionsByTrending: function (tag, limit) {
        return new Promise(function (yes, no) {
            steem.api.getDiscussionsByTrending({tag: tag, limit: limit}, function (err, result) {
                if (err) no(err);
                yes(result);
            });
        })
    },
    printLink: function (result) {

        var img = oust(result.body, 'images');

        if (img.length > 0) {
            thumbnail = {
                url: img[0]
            }
        } else {
            thumbnail = {
                url: 'https://cdn.mxone.host/own.png'
            }
        }

        return embed = {
            color: 0x3498db,
            author: {name: "@" + result.author},
            title: result.title,
            description: h2p(removeMd(result.body)).substring(0, 2040) + '...',
            url: "https://steemit.com" + result.url,
            thumbnail: thumbnail,
            fields: [
                this.getField("Author reputation", steem.formatter.reputation(result.author_reputation), true),
                this.getField("Votes", result.net_votes, true),
                this.getField("Pending Payout", result.pending_payout_value, true),
                this.getField("Posted Time", time_ago(new Date(result.created) - (1000 * 60)), true)
            ],
            footer: {text: "KuyaBot is a bot by @cloh76"}
        };


    },
    getEmbedProfile:
        function (profile) {

            var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            var created = new Date(profile.created);

            created = monthNames[created.getMonth()] + ' ' + created.getDate() + ', ' + created.getFullYear();

            let data = {
                about: "No bio",
                location: "Steem Blockchain",
                website: "No website",
                profile_image: "https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948447/p72avlprkfariyti7q2l.png"
            };


            if (profile.json_metadata.length > 0) {
                data = JSON.parse(profile.json_metadata);
                if (data.hasOwnProperty('profile')) {
                    data = data.profile;
                    if (!data.hasOwnProperty("about")) {
                        data.about = "No bio";
                    }
                    if (!data.hasOwnProperty("location")) {
                        data.location = "Steem Blockchain";
                    }
                    if (!data.hasOwnProperty("website")) {
                        data.website = "No website";
                    }
                    if (!data.hasOwnProperty("profile_image")) {
                        data.profile_image = "https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948447/p72avlprkfariyti7q2l.png";
                    }
                } else {
                    data = {
                        about: "No bio",
                        location: "Steem Blockchain",
                        website: "No website",
                        profile_image: "https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948447/p72avlprkfariyti7q2l.png"
                    };

                }

            }

            return {
                color: 0x3498db,
                author: {name: "@" + profile.name},
                description: data.about,
                title: "Steem profile of @" + profile.name,
                url: "https://steemit.com/@" + profile.name,
                thumbnail: {
                    url: data.profile_image
                },
                fields: [
                    this.getField("Posts", profile.post_count, true),
                    this.getField("Reputation", steem.formatter.reputation(profile.reputation), true),
                    this.getField("Followers", profile.follower, true),
                    this.getField("Following", profile.following, true),
                    this.getField("STEEM", profile.balance, true),
                    this.getField("STEEM Power", profile.steempower, true),
                    this.getField('Estimated Value', profile.valueUSD + " USD", true),
                    this.getField("Joined", created, true),
                    this.getField("Location", data.location, true),
                    this.getField("Website", data.website, true)
                ],
                footer: {text: "KuyaBot is a bot by @cloh76"}
            };


        },
    getField: function (name, value, inline) {
        return {
            name: name,
            value: value,
            inline: inline
        }
    }
};


module.exports = utils;
