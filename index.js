const Discord = require('discord.js')
const bot = new Discord.Client()

bot.on('message', (message) => {
    if (message.content == 'ping'){
        message.channel.sendMessage('pong')
    }
})


bot.login('NDM1NDAzMjE1NTAxMDAwNzA0.DbYfdQ.TiIFD_n-y2VqJds4PUe2Fd-80-g')
