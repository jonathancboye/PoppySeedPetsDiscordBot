const Discord = require('discord.js');
const process = require('process');
const axios = require('axios').default;

const client = new Discord.Client();
const discordToken = process.env.POPPYSEEDPETSBOTTOKEN;
const poppySeedUserName = process.env.POPPYSEEDUSERNAME;
const poppySeedPassword = process.env.POPPYSEEDPASSWORD;

const snowFlakes = {
    botsNStuff : "716195516328968264"
};

(async (client
    , discordToken
    , poppySeedUserName
    , poppySeedPassword
) => {
    await client.login(discordToken);
    
    const poppySeedToken =
        await login(poppySeedUserName, poppySeedPassword);
    const channel =
        await client.channels.fetch(snowFlakes.botsNStuff);
    const message =
        new Discord.Message(client, {}, channel);
    const bot =
    {
        poppySeedToken: poppySeedToken
        , discordToken: discordToken
        , message: message
    }

    registerEvents(bot);


})(client
    , discordToken
    , poppySeedUserName
    , poppySeedPassword
);

function registerEvents(bot) {
    client.on('message', msg => {
        let command = parseCommand(msg.content);

        switch (command) {
            case 'help':
                showHelp(msg, bot.poppySeedToken);
                break;
            case 'topDonors':
                showTopDonors(msg, bot.poppySeedToken);
                break;
        }
    });
}


function parseCommand(message) {
    var command = '';
    var argument = '';
    var commandPattern = /^\.(\w+)( \w+)*/g;

    if (message.match(commandPattern) != null) {
        command = message.replace(commandPattern, '$1');
    }

    return command;
}

async function login(username, password) {
    return axios({
        method: 'post',
        url: 'https://api.poppyseedpets.com/account/logIn',
        data: {
            "email": username
            , "passphrase": password
            , "sessionHours": 168
        }
    }).then(res => {
        return res.data.sessionId;
    }).catch(err => {
        console.log(err);
    });
}

function showHelp(message, token) {
        let helpMessage = 
            "Look what I can do! \n"
            + ".topDonors";

        message.reply(helpMessage);
}

async function showTopDonors(message, token) {
    const donors = 
        await getTopDonors(token);

    message.reply(donorView(donors));
}

function donorView(users) {
    let message = "The top donors are:";
    let topDonors = users
        .map(u => u.user.name)
        .reduce((first, rest) => first + "\n" + rest);

    return message + "\n" + topDonors;
}

async function getTopDonors(token) {
    return axios({
        method: 'get'
        , url: 'https://api.poppyseedpets.com/museum/topDonors?page=0'
        , headers: {
            'Authorization': 'Bearer ' + token
        }
    }).then(res => {
        return res.data.data.results;
    }).catch(err => {
        console.log(err);
    });
}
