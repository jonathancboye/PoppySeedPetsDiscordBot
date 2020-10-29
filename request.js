const axios = require('axios')

module.exports = {
    getTopDonors: getTopDonors,
    getLatestItems : getLatestItems,
    getPetShelter : getPetShelter,
}

function getRequest(url, token) {
    return request('get', url, token);
}

function postRequest(url, token) {
    return request('post', url, token);
}

function request(method, url, token) {
    return axios({
        method: method
        , url: url
        , headers: {
            'Authorization': 'Bearer ' + token
        }
    });
}

function sendRequest(url, token) {
    return getData(url, token)
        .catch((err) =>
            getRunHours(token)
                .then(() => getData(url, token))
        );
}

function getData(url, token) {
    return getRequest(url, token)
        .then(res => {
            console.log(res)
            return res.data.data.results;
        });
}

function getRunHours(token) {
    return postRequest('https://api.poppyseedpets.com/house/runHours', token)
}

function getTopDonors(token) {
    return sendRequest('https://api.poppyseedpets.com/museum/topDonors?page=0', token);
}

function getLatestItems(token) {
    return sendRequest('https://api.poppyseedpets.com/encyclopedia/item?page=0&orderBy=id&orderDir=reverse', token);
}

function getPetShelter(token) {
    return sendRequest('https://api.poppyseedpets.com/pet?page=0&filter%5Bowner%5D=199&filter%5BinDaycare%5D=true', token);
}