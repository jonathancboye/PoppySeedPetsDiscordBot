const axios = require('axios')

module.exports = {
    sendRequest : sendRequest,
    getTopDonors: getTopDonors,
    getLatestItems : getLatestItems,
    getPetShelter : getPetShelter,
}

function getAuthorizationHeader(token) {
    return {
        'Authorization': 'Bearer ' + token
    };
}

function getTopDonorsRequest(token) {
    return axios({
        method: 'get'
        , url: 'https://api.poppyseedpets.com/museum/topDonors?page=0'
        , headers: getAuthorizationHeader(token)
    });
}

function getItemRequest(token) {
    return axios({
        method: 'get'
        , url: 'https://api.poppyseedpets.com/encyclopedia/item?page=0&orderBy=id&orderDir=reverse'
        , headers: getAuthorizationHeader(token)
    });
}

function getPetShelterRequest(token) {
    return axios({
        method: 'get'
        , url: 'https://api.poppyseedpets.com/pet?page=0&filter%5Bowner%5D=199&filter%5BinDaycare%5D=true'
        , headers: getAuthorizationHeader(token)
    });
}

function getRunHours(token) {
   return axios({
       method: 'post'
       , url: "https://api.poppyseedpets.com/house/runHours"
       , headers: getAuthorizationHeader(token)
   })
}

function sendRequest(token, request) {
    return request(token)
        .catch(() =>
            getRunHours(token)
                .then(() => request(token))
        );
}

function getTopDonors(token) {
    return getTopDonorsRequest(token)
        .then(res => {
            return res.data.data.results;
        });
}

function getLatestItems(token) {
    return getItemRequest(token)
        .then(res => {
            return res.data.data.results;
        });
}

function getPetShelter(token) {
    return getPetShelterRequest(token)
        .then(res => {
            return res.data.data.results;
        });
}