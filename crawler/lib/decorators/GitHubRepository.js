const logger = require('winston');

const github = require('../connections/github.js');
const GitHubRepository = require('../parsers/GitHubRepository.js');

const urlRegex = new RegExp('^(https?://)?(www\.)?github\.com/(?<ownerName>[^/?]+)/(?<repoName>[^/?]+)/?$');

/**
 * Decorate a project with GitHub repository data
 * @class
 */
module.exports = class GitHubRepositoryDecorator {

    static async canDecorate ({ code_url = null, github = null }) {
        if (!code_url || github) {
            return false;
        }

        return urlRegex.test(code_url);
    }

    static async decorate (projectData) {
        const { ownerName, repoName } = urlRegex.exec(projectData.code_url).groups;

        let response;

        try {
            response = await github.get(`/repos/${ownerName}/${repoName}`);
        } catch (err) {
            logger.error(`GitHub request for repo ${ownerName}/${repoName} failed: ${err.response ? err.response.data.message || err.response.status : err.message}`);

            if (err.response && err.response.status == 404) {
                projectData.github = false;
                return;
            }

            // GitHub will return 403 when you hit rate limit without auth
            if (err.response && err.response.status == 403) {
                logger.error('hit GitHub rate limit, try setting GITHUB_ACTOR and GITHUB_TOKEN');
                process.exit(1);
            }

            return;
        }

        projectData.github = GitHubRepository.extractInterestingData(response.data);
    }
};
