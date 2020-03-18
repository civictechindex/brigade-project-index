const repositoryClasses = require('../repositories/projects');

/**
 * Collection of methods for analyzing and manipulating organization data
 * @class
 */
module.exports = class Organization {

    /**
     * Go through available project repository classes and use the first one that
     * self-reports as able to load projects for the given organization data
     */
    static async loadProjects (organizationData) {
        for (const repositoryClassName in repositoryClasses) {
            const repositoryClass = repositoryClasses[repositoryClassName];
            if (await repositoryClass.canLoadFromOrganization(organizationData)) {
                return repositoryClass.loadFromOrganization(organizationData);
            }
        }
    }
};
