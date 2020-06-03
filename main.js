const Discord = require('discord.js');
const process = require('process');
const axios = require('axios').default;
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const client = new Discord.Client();
const discordToken = process.env.POPPYSEEDPETSBOTTOKEN;
const poppySeedUserName = process.env.POPPYSEEDUSERNAME;
const poppySeedPassword = process.env.POPPYSEEDPASSWORD;

const snowFlakes = {
    botsNStuff: "716195516328968264"
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
    bot.message.reply("I have no special talents. I am only passionately curious.")
    
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
            case 'orphans':
               showPetShelter(msg, bot.poppySeedToken); 
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
        + ".latestItems \n"
        + ".orphans \n";

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

async function showLatestItems(message, token) {
    const items = await getLatestItems(token);
    const result = await itemsView(items);
    message.reply(result);
}

async function itemsView(items) {
    let message = "The latest items are:";
    let latestItems = [];
    
    for(let i = 0; i < Math.min(10, items.length); i++) {
        console.log(items[i]);
        let view = await itemView(items[i]);
        latestItems.push(view);
    }

    let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle("Latest Items")
        .attachFiles(latestItems.map(item => item.image))
    latestItems.forEach(item => {
        embed.addField(item.name, item.value)
        embed.setAuthor('', '', item.attachmentUrl)
    });

    

    return embed;
}

function first(num) {
    return (value, index) => index <= num;
}

function addSpace(num) {
    return item => item + "\n".repeat(num);
}

async function itemView(item) {
    console.log(item);
    const { name, description, image } = item;
    const desc =
        (description === null)
            ? "_"
            : description;
    let attachmentUrl = "";

    if(image !== undefined)
    {
        await downloadItemImage(image);
        attachmentUrl = getItemAttachmentUrl(image + ".png");
    }

    return { 
        name: name,
        value: desc,
        attachmentUrl: attachmentUrl,
        image: image + ".png",
        inline: false
    }
}

async function showItemImage(message, token, itemImage) {
    const image =
        await downloadItemImage(itemImage);

    message.reply(image);
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

function getItemImageUrl(image) {
    return `https://poppyseedpets.com/assets/images/items/${image}.svg`;
}

function getItemAttachmentUrl(image) {
    return `attachment://${path.basename(image)}`
}

async function downloadItemImage(image) {
    return axios({
        method: 'get'
        , url: `https://poppyseedpets.com/assets/images/items/${image}.svg`
    }).then(res => {
        let buffer = Buffer.from(res.data);
        let dir = path.dirname(image);
        
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        sharp(buffer)
            .resize(96, 96)
            .png()
            .toFile(`${image}.png`);
    }).catch(err => {
        console.log(err);
    });
}

async function showPetShelter(msg, token) {
    const shelterPets = await getPetShelter(token);
    msg.reply(showPetView(shelterPets));
}

function showPetView(shelterPets) {
    let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle("These pets need a home")
    shelterPets.forEach(pet => addPetViewEmbedFields(embed, pet));

    return embed;
}

function addPetViewEmbedFields(embed, pet) {
    embed.setColor(pet.colorA);
    embed.addField(pet.name, showPetDescription(pet));
}

function showPetDescription(pet) {
    return `BirthDate: ${pet.birthDate}\n`;
}

async function getPetShelter(token) {
    return axios({
        method: 'get'
        , url: 'https://api.poppyseedpets.com/pet?page=0&filter%5Bowner%5D=199&filter%5BinDaycare%5D=true'
        , headers: {
            'Authorization': 'Bearer ' + token
        }
    }).then(res => {
        return res.data.data.results;
    }).catch(err => {
        console.log(err);
    }); 
}
