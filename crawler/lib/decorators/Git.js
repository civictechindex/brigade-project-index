const logger = require('winston');
const gitUp = require('git-up');

const ScratchGit = require('../ScratchGit.js');

/**
 * Decorate a project with data about its git repository
 * @class
 */
module.exports = class GitDecorator {

    static async canDecorate ({ code_url = null, github = null, git = null }) {
        if (!code_url) {
            return false;
        }

        const { resource, pathname, protocols } = gitUp(code_url);

        return Boolean(resource && pathname && protocols.length && github !== false);
    }

    static async decorate (projectData) {
        // TODO: sniff ${url}/info/refs for HTTP to catch bad repos? ehh github doesn't like
        const commitHash = await ScratchGit.fetchRemote(projectData.code_url);

        projectData.git = commitHash ? { head: commitHash } : false;
    }
};
