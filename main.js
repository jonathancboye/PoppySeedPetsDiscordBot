const Discord = require('discord.js');
const process = require('process');
const axios = require('axios').default;
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const R = require('ramda');
const request = require('./request');

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
        await request.sendRequest(token, request.getTopDonors);

    message.reply(donorView(donors));
}

function donorView(users) {
    let message = "The top donors are:";
    let topDonors = users
        .map(u => u.user.name)
        .reduce(joinStr("\n"));

    return message + "\n" + topDonors;
}

async function showLatestItems(message, token) {
    const items = await request.sendRequest(token, request.getLatestItems);
    const results = await itemsView(items);

    for (let i = 0; i < results.length; i++) {
        let item = results[i];
        message.reply(null, item);
    }
}

async function itemsView(items) {
    let message = "The latest items are:";
    let latestItems = [];

    for (let i = 0; i < Math.min(10, items.length); i++) {
        let view = await itemView(items[i]);
        latestItems.push(view);
    }

    return latestItems;
}

function first(num) {
    return (value, index) => index <= num;
}

function addSpace(num) {
    return item => item + "\n".repeat(num);
}

async function itemView(item) {
    const { name, description, image } = item;
    const desc =
        (description === null)
            ? "_"
            : description;
    let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(name)
        .setDescription(desc)

    await attachFiles(downloadItemImage, embed, image);

    return {
        embed: embed,
        content: name
    };
}

async function attachFiles(download, embed, image) {
    if (image !== undefined) {
        let file = await download(image);
        let attachmentUrl = getItemAttachmentUrl(file);

        embed
            .attachFiles(file)
            .setImage(attachmentUrl);
    }
}

function joinStr(delimiter) {
    return (first, rest) =>
        first + delimiter + rest
}


function getItemImageUrl(image) {
    return `https://poppyseedpets.com/assets/images/items/${image}.svg`;
}

function getItemAttachmentUrl(image) {
    return `attachment://${path.basename(image)}`
}


async function downloadItemImage(image) {
    let fileName = getLocalItemImageFileName(image);

    if(fs.existsSync(fileName)){
        return new Promise((res) => res(fileName));
    }

    return axios({
        method: 'get'
        , url: `https://poppyseedpets.com/assets/images/items/${image}.svg`
    }).then(async res => {
        console.log('Filename: ' + fileName);
        await saveAsPng(res.data, fileName);
        return fileName;
    }).catch(err => {
        console.log(err);
    });
}

async function downloadPetImage(petColors, image) {
    let fileName = getLocalPetImageFileName(image);

    if(fs.existsSync(fileName)){
        return new Promise((res) => res(fileName));
    }

    return axios({
        method: 'get'
        , url: `https://poppyseedpets.com/assets/images/pets/${image}.svg`
    }).then(async res => {
        let coloredSvg = colorSvg(res.data, petColors);
        await saveAsPng(coloredSvg, fileName);
        return fileName;
    }).catch(err => {
        console.log(err);
    });
}

function colorSvg(svgBuffer, petColors) {
    return svgBuffer.replace(
        /(<svg.*?>)/
        , `$1<style>.colorA { fill: #${petColors.colorA} } .colorB { fill: #${petColors.colorB} }</style>`
    );
}

function saveAsPng(svgBuffer, image) {
    const buffer = Buffer.from(svgBuffer);
    const dir = path.dirname(image);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    sharp(buffer, {density: 200})
        .resize(100,100)
        .png()
        .toFile(image);
}

function getLocalPetImageFileName(image) {
    return 'pets/' + image + '.png';
}

function getLocalItemImageFileName(image) {
    return 'items/' + image + '.png';
}

async function showPetShelter(msg, token) {
    const shelterPets = await request.sendRequest(token, request.getPetShelter);
    const pets = await showPetsView(shelterPets);
    pets.forEach(pet => msg.reply(pet));
}

async function showPetsView(pets) {
    let embeds = [];

    for (let i = 0; i < pets.length; i++) {
        embeds.push(await showPetView(pets[i]));
    }

    return embeds;
}

async function showPetView(pet) {
    const downloadPet = R.curry(downloadPetImage);
    const petColors = {
        colorA: pet.colorA,
        colorB: pet.colorB
    };
    let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(pet.name)
        .setDescription(pet.birthDate);

    await attachFiles(downloadPet(petColors), embed, pet.species.image);

    return embed;
}