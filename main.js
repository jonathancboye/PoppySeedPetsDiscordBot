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
            case 'latestItems':
                showLatestItems(msg, bot.poppySeedToken);
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
            + ".topDonors \n"
            + ".latestItems"

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
        .reduce(joinStr("\n"));

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

//https://api.poppyseedpets.com/encyclopedia/item?page=0&orderBy=id&orderDir=reverse
// https://poppyseedpets.com/assets/images/items/IMAGE_STRING_HERE.svg
async function showLatestItems(message, token) {
    const items = await getLatestItems(token);
    message.reply(itemsView(items));
}

function itemsView(items) {
    let message = "The latest items are:";
    let latestItems = items
        .map(itemView)
        .filter(first(10))
        .map(addSpace(3))
        .reduce(joinStr("\n"));

    return message + "\n" + latestItems;
}

function first(num) {
    return (value, index) => index <= num;
}

function addSpace(num) {
    return item => item + "\n".repeat(num); 
}

function itemView(item) {
    const {name, description} = item;
    const desc = 
        (description === null) 
        ? "" 
        : ": " + description;

    return name + desc;
}

function joinStr(delimiter) {
    return (first, rest) => 
        first + delimiter + rest
}


async function getLatestItems(token) {
    return axios({
        method: 'get'
        , url: 'https://api.poppyseedpets.com/encyclopedia/item?page=0&orderBy=id&orderDir=reverse'
        , headers: {
            'Authorization': 'Bearer ' + token
        }
    }).then(res => {
        return res.data.data.results;
    }).catch(err => {
        console.log(err);
    });
}
