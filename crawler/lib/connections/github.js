const axios = require('axios');
const axiosRetryAfter = require('axios-retry-after');

const { GITHUB_ACTOR: githubActor, GITHUB_TOKEN: githubToken } = process.env;

const axiosClient = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.mercy-preview+json'
    },
    auth: githubActor && githubToken
        ? { username: githubActor, password: githubToken }
        : null
});

axiosClient.interceptors.response.use(null, axiosRetryAfter(axiosClient, {
    // GitHub responds with 403 instead of 429 when soft rate limit is hit
    isRetryable (error) {
        return (
            error.response && error.response.status === 403 &&
            error.response.headers['retry-after']
        );
    },

    wait (error) {
        return new Promise(
            resolve => setTimeout(resolve, error.response.headers['retry-after'] * 1000)
        );
    }
}));

module.exports = axiosClient;
