import * as Discord from "discord.js"
import * as ytdl from "ytdl-core"
import * as _ from "lodash"
import * as fs from 'fs'
const BOT = new Discord.Client();
const MANIFEST = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'))

BOT.login(MANIFEST.bot)

var Connection = null
var StreamDispatcher = null
var AudioQueue = []
var AudioQueueIndex = 0

// List of available commands
const COMMANDS = {
    ':help': {
        action: message => showHelp(message),
        description: "List of all possible commands."
    },
    ':ping': {
        action: message => message.channel.send('pong'),
        description: "Pong!"
    },
    ':pong': {
        action: message => message.channel.send('ping'),
        description: "Ping!"
    },
    ':join': {
        action: message => joinChannel(message),
        description: "Join the user's voice channel."
    },
    ':leave': {
        action: message => leaveChannel(message),
        description: "Leave the current voice channel."
    },
    ':play': {
        action: message => playSound(),
        description: "Start playing audio."
    },
    ':stop': {
        action: message => stopSound(message),
        description: "Stop playing audio."
    },
    ':pause': {
        action: message => pauseSound(message),
        description: "Pause the current audio track."
    },
    ':resume': {
        action: message => resumeSound(message),
        description: "Resume the current audio track."
    },
    ':add': {
        action: message => addSoundToQueue(message),
        description: "Add an audio track from youtube at the end of the playlist."
    },
    ':next': {
        action: message => nextSound(message),
        description: "Skip to the next audio track."
    },
    ':previous': {
        action: message => previousSound(message),
        description: "Skip to the previous audio track."
    },
}

// Listen messages
BOT.on('message', (message) => {

    // Check if message sender is bot or not
    if (message.author.bot == true) {
        return true;
    }

    // Get command (first word of string)
    let command = _.split(message.content, " ")[0]

    // If command exists go
    if (COMMANDS.hasOwnProperty(command)) {
        COMMANDS[command].action(message)
    }
})

// disconnect the bot when killing the process
process.on('SIGINT', () => {
    leaveChannel()
    process.exit()
})


function showHelp(message) {
    let text = ''
    for (let command in COMMANDS) {
        console.log(command)
        let commandHelp: string
        commandHelp = '**' + command + '** : ' + COMMANDS[command].description + '\n'
        console.log(commandHelp)
        text += commandHelp
    }
    console.log(text)
    message.channel.send(text)
}

function playSound() {
    // Log
    let url = AudioQueue[AudioQueueIndex]
    console.log("Sound to play : " + url)

    if (url) {
        StreamDispatcher = Connection.playStream(ytdl(
            url, { filter: 'audioonly' }
        ), { volume: 0.1 })
    } else {
        console.log("No sound to play!")
        return
    }
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
    if (AudioQueueIndex < AudioQueue.length - 1) {
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
    else {
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

function joinChannel(message) {

    // Get channel
    let channel = message.member.voiceChannel

    if (channel) {
        // Log
        console.log("Ask to join channel : ", channel.name)
        channel.join().then(conn => Connection = conn)
    } else {
        message.channel.sendMessage('You need to join a voice channel first.')
    }
}

function leaveChannel(message?) {

    // Get channel
    let channel = BOT.voiceConnections.first().channel


    // Log
    console.log("Ask to Leave channel : ", channel.name)

    // Be sure that channels exist
    if (channel) {

        // Leave channel and turn off connection
        channel.leave()
        Connection = null

    } else {

        // If channel doesnt exist, err msg
        if (message) {
            message.channel.sendMessage('I cannot leave')
        }

    }
}
