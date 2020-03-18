/**
 * Collection of methods for analyzing and manipulating GitHub repository
 * @class
 */
module.exports = class GitHubRepository {

    /**
     * Build a set of defaults for a standard "project" object from raw GitHub repository data
     */
    static async buildProjectDefaults (repositoryData) {
        return {
            name: repositoryData.name,
            code_url: repositoryData.html_url,
            description: repositoryData.description,
            git_url: repositoryData.git_url,
            git_branch: repositoryData.default_branch,
            link_url: repositoryData.homepage || null,
            topics: repositoryData.topics.length ? repositoryData.topics : null
        };
    }
};
