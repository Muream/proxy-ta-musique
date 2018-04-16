const Discord = require('discord.js')
const ytdl = require('ytdl-core')
const bot = new Discord.Client()

var connection = null

const commands = {
    'ping': message => message.channel.sendMessage('pong'),
    'join': message => joinChannelFromCommand(message),
    'leave': message => leaveChannel(message),
    'play': message => playSound(message),
}

async function playSound(message) {
    let url = getYoutubeURL(message.content)
    connection.playStream(ytdl(
        url, { filter: 'audioonly' }
    ), { volume: 0.1 })
}

function getYoutubeURL(message) {
    let url = message.match(/\bhttps?:\/\/\S+/gi)[0]
    console.log(url)
    return url
}

async function joinChannelFromCommand(message) {
    let channel = message.member.voiceChannel
    if (channel) {
        connection = await channel.join()
    } else {
        message.channel.sendMessage('You need to join a voice channel first.')
    }
}

function leaveChannel(message) {
    let channel = message.member.voiceChannel
    if (channel) {
        channel.leave()
        connection = null
    } else {
        message.channel.sendMessage('I cannot leave')
    }
}


bot.on('message', (message) => {
    let command = message.content.split(' ')[0]
    if (commands.hasOwnProperty(command)) {
        commands[command](message)
    }
})


bot.login('NDM1NDAzMjE1NTAxMDAwNzA0.DbYfdQ.TiIFD_n-y2VqJds4PUe2Fd-80-g')