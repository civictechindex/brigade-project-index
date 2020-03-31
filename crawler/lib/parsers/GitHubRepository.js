/**
 * Collection of methods for analyzing and manipulating GitHub repository data
 * @class
 */
module.exports = class GitHubRepository {

    /**
     * Build a set of defaults for a standard "project" object from raw GitHub object data
     */
    static extractInterestingData (objectData) {
        const output = {};

        for (const key in objectData) {
            if (key.endsWith('_url') || key == 'url') {
                continue;
            }

            const value = objectData[key];

            if (typeof value == 'object' && !Array.isArray(value)) {
                output[key] = GitHubRepository.extractInterestingData(value);
            } else {
                output[key] = value;
            }
        }

        return output;
    }
};
