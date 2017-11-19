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
           

bot.login('MzQ1NTUyNjM4MTUyMjc4MDM5.DHBm-A.hj4XTFZQQVj_j0zJRiA3FUhUr-U');


