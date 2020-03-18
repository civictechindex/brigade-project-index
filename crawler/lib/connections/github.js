const axios = require('axios');

const { GITHUB_ACTOR: githubActor, GITHUB_TOKEN: githubToken } = process.env;

module.exports = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.mercy-preview+json'
    },
    auth: githubActor && githubToken
        ? { username: githubActor, password: githubToken }
        : null
});
