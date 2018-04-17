import * as Discord from "discord.js"
import * as ytdl from "ytdl-core"
import * as _ from "lodash"
import * as fs from 'fs'
const BOT = new Discord.Client();
const MANIFEST = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'))

var Connection = null
var StreamDispatcher = null
var AudioQueue = []
var AudioQueueIndex = 0

// List of available commands
const Commands = {
    'ping': message => message.channel.sendMessage('pong'),
    'pong': message => message.channel.sendMessage('ping'),
    'join': message => joinChannelFromCommand(message),
    'leave': message => leaveChannel(message),
    'play': message => playSound(),
    'stop': message => stopSound(message),
    'pause': message => pauseSound(message),
    'resume': message => resumeSound(message),
    'add': message => addSoundToQueue(message),
    'next': message => nextSound(message),
    'previous': message => previousSound(message),
}

// Listen messages
BOT.on('message', (message) => {

    // Check if message sender is bot or not
    if(message.author.bot == true){
        return true;
    }

    // Get command (first word of string)
    let command = _.split(message.content, " ")[0]

    // If command exists go
    if (Commands.hasOwnProperty(command)) {
        Commands[command](message)
    }
})


BOT.login(MANIFEST.bot)


async function playSound() {
    // Log
    let url = AudioQueue[AudioQueueIndex]
    console.log("Sound to play : " + url)

    StreamDispatcher = Connection.playStream(ytdl(
        url, { filter: 'audioonly' }
    ), { volume: 0.1 })
}

function stopSound(message) {
    StreamDispatcher.end()
}

function pauseSound(message) {
    StreamDispatcher.pause()
}

function resumeSound(message) {
    StreamDispatcher.resume()
}

function nextSound(message) {
    // Stop current streaming
    StreamDispatcher.end()

    // Go to next sound
    if(AudioQueueIndex < AudioQueue.length - 1){
        AudioQueueIndex = AudioQueueIndex + 1
    }

    // Play sound
    playSound()

}

function previousSound(message) {
    // Stop current streaming
    StreamDispatcher.end()

    // Go to previous sound
    if (AudioQueueIndex > 0) {
        AudioQueueIndex = AudioQueueIndex - 1
    }

    // Play sound
    playSound()

}

function addSoundToQueue(message) {
    let url = getYoutubeURL(message.content)
    console.log("Ask to add sound : " + url)

    // Check if url ok
    if (!url.includes("error")) {
        // Add sound to queue
        AudioQueue.push(url)
    }
    else{
        // If error
        message.channel.sendMessage('Bad link u bad :/')
    }
}

function getYoutubeURL(message) {

    // Log
    console.log("Get youtube URL : ", message)

    // Get arg
    let urlToCheck = _.split(message, " ")[1]

    // Set regex
    let urlRegex = RegExp(/\bhttps?:\/\/\S+/gi)

    // Regex to get URL
    if (urlRegex.test(urlToCheck))
    {
        return urlToCheck
    }
    else
    {
        console.log(urlToCheck + " doesnt match url regex !")
        return "error"
    }
}

async function joinChannelFromCommand(message) {

    // Get channel
    let channel = message.member.voiceChannel

    // Log
    console.log("Ask to join channel : ", channel.name)

    if (channel) {
        Connection = await channel.join()
    } else {
        message.channel.sendMessage('You need to join a voice channel first.')
    }
}

function leaveChannel(message) {

    // Get channel
    let channel = message.member.voiceChannel

    // Log
    console.log("Ask to Leave channel : ", channel.name)

    // Be sure that channels exist
    if (channel) {
        
        // Leave channel and turn off connection
        channel.leave()
        Connection = null

    } else {

        // If channel doesnt exist, err msg
        message.channel.sendMessage('I cannot leave')

    }
}
