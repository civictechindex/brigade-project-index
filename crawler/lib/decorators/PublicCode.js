const logger = require('winston');
const gitUp = require('git-up');
const yaml = require('js-yaml');

const ScratchGit = require('../ScratchGit.js');

/**
 * Decorate a project with publiccode.yml data from git
 * @class
 */
module.exports = class PublicCodeDecorator {

    static async canDecorate ({ git = null }) {
        return Boolean(git && git.head);
    }

    static async decorate (projectData) {
        const git = await ScratchGit.getGit();

        let publicCodeData;

        const publicCodeString = await git.catFile({ p: true }, `${projectData.git.head}:publiccode.yml`, { $nullOnError: true });
        if (publicCodeString) {
            try {
                publicCodeData = yaml.safeLoad(publicCodeString);
            } catch (err) {
                logger.warn(`failed to load ${projectData.code_url}/publiccode.yml: ${err}`);
                projectData['publiccode.yml'] = false;
            }
        }

        projectData['publiccode.yml'] = publicCodeData || false;
    }
};
