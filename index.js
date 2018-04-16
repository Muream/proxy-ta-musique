const Discord = require('discord.js')
const bot = new Discord.Client()

const commands  = {
    'ping': message => message.channel.sendMessage('pong'),
    'join': message => joinChannelFromCommand(message),
    'leave': message =>  leaveChannel(message)
}

function joinChannelFromCommand(message) {
    let channel = message.member.voiceChannel
    if(channel) {
        channel.join()
    } else {
        message.channel.sendMessage('You need to join a voice channel first.')
    }
}

function leaveChannel(message) {
    let channel = message.member.voiceChannel
    if(channel) {
        console.log(typeof channel)
        channel.leave()
    } else {
        message.channel.sendMessage('I cannot leave')
    }
}


bot.on('message', (message) => {
    if (commands.hasOwnProperty(message.content)) {
        commands[message.content](message)
    }
})


bot.login('NDM1NDAzMjE1NTAxMDAwNzA0.DbYfdQ.TiIFD_n-y2VqJds4PUe2Fd-80-g')