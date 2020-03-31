/**
 * Collection of methods for analyzing and manipulating GitHub repository data
 * @class
 */
module.exports = class GitHubRepository {

    /**
     * Build a set of defaults for a standard "project" object from raw GitHub repository data
     */
    static extractInterestingData (repositoryData) {
        const output = {};

        for (const key in repositoryData) {
            if (key.endsWith('_url') || key == 'url') {
                continue;
            }

            if (key == 'owner') {
                const ownerData = repositoryData[key];
                const ownerOutput = {};

                for (const ownerKey in ownerData) {
                    if (ownerKey.endsWith('_url') || key == 'url') {
                        continue;
                    }

                    ownerOutput[ownerKey] = ownerData[ownerKey];
                }

                output[key] = ownerOutput;
                continue;
            }

            output[key] = repositoryData[key];
        }

        return output;
    }
};
