import * as Discord from "discord.js"
import * as ytdl from "ytdl-core"
import * as youtubeSearch from "youtube-search"
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
    '$help': {
        action: message => showHelp(message),
        description: "List of all possible commands."
    },
    '$ping': {
        action: message => message.channel.send('pong'),
        description: "Pong!"
    },
    '$pong': {
        action: message => message.channel.send('ping'),
        description: "Ping!"
    },
    '$join': {
        action: message => joinChannel(message),
        description: "Join the user's voice channel."
    },
    '$leave': {
        action: message => leaveChannel(message),
        description: "Leave the current voice channel."
    },
    '$play': {
        action: message => playTrack(),
        description: "Start playing audio."
    },
    '$stop': {
        action: message => stopTrack(message),
        description: "Stop playing audio."
    },
    '$pause': {
        action: message => pauseTrack(message),
        description: "Pause the current audio track."
    },
    '$resume': {
        action: message => resumeTrack(message),
        description: "Resume the current audio track."
    },
    '$add': {
        action: message => addTrackToQueue(message),
        description: "Add an audio track from youtube at the end of the playlist."
    },
    '$next': {
        action: message => nextTrack(message),
        description: "Skip to the next audio track."
    },
    '$previous': {
        action: message => previousTrack(message),
        description: "Skip to the previous audio track."
    },
    '$search': {
        action: message => searchYoutube(message),
        description: "Search youtube"
    },
}

// Listen messages
BOT.on('message', (message) => {

    // Check if message sender is bot or not
    if (message.author.bot == true) {
        return true
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
        let commandHelp: string
        commandHelp = '**' + command + '** : ' + COMMANDS[command].description + '\n'
        text += commandHelp
    }
    message.channel.send(text)
}

function playTrack() {
    // Log
    let url = AudioQueue[AudioQueueIndex]
    console.log("Track to play : " + url)

    if (url) {
        StreamDispatcher = Connection.playStream(
            ytdl(url, { filter: 'audioonly' }),
            { volume: 0.1 }
        )
    } else {
        console.log("No sound to play!")
        return
    }
}

function stopTrack(message) {
    StreamDispatcher.end()
    console.log("Stopped playing.")
}

function pauseTrack(message) {
    StreamDispatcher.pause()
    console.log("Paused playing.")
}

function resumeTrack(message) {
    StreamDispatcher.resume()
    console.log("Resumed playing.")
}

function nextTrack(message) {
    // Stop current streaming
    StreamDispatcher.end()

    // Go to next sound
    if (AudioQueueIndex < AudioQueue.length - 1) {
        AudioQueueIndex = AudioQueueIndex + 1
    }

    // Play sound
    playTrack()
}

function previousTrack(message) {
    // Stop current streaming
    StreamDispatcher.end()

    // Go to previous sound
    if (AudioQueueIndex > 0) {
        AudioQueueIndex = AudioQueueIndex - 1
    }

    // Play sound
    playTrack()

}

function addTrackToQueue(message) {
    let url = getYoutubeURL(message.content)
    console.log("Ask to add sound : " + url)

    // Check if url ok
    if (!url.includes("error")) {
        // Add sound to queue
        AudioQueue.push(url)
    }
    else {
        // If error
        message.channel.send('Bad link u bad :/')
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

function searchYoutube(message) {
    // remove the command from the message
    let stringToSearch = _.join(_.split(message.content, " ").slice(1), " ")

    // youtube options
    let opts: youtubeSearch.YouTubeSearchOptions = {
        maxResults: 1,
        type: 'video',
        regionCode: 'FR',
        key: MANIFEST.youtube
    }

    console.log("Searching string:", stringToSearch)
    youtubeSearch(stringToSearch, opts).then(
        (result) => {
            let res = result[0]
            let url = res.link
            let title = res.title
            console.log("Found \"" + title + "\" at " + url)
            AudioQueue.push(url)

            // Feedback
            let embedMsg = new Discord.RichEmbed({
                url: url,
                thumbnail: { url: res.thumbnails.default.url }
                title: title,
                footer: {
                    text: "Added by " + message.author.username,
                    icon_url: message.author.avatarURL,
                },
            })
            message.channel.send("**" + title + "** was added to the playlist", embedMsg)
        }
    )
}

function joinChannel(message) {

    // Get channel
    let channel = message.member.voiceChannel

    if (channel) {
        // Log
        console.log("Ask to join channel : ", channel.name)
        channel.join().then(conn => {
         Connection = conn   
            message.channel.send("Joined " + channel.name + "!")
        })
    } else {
        message.channel.send('You need to join a voice channel first.')
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
            message.channel.send('I cannot leave')
        }

    }
}
