const GitSheets = require('gitsheets');


/**
 * Gateway to a collection of projects
 * @class
 */
module.exports = class Projects extends Map {

    static async canLoadFromOrganization (organizationData) {
        throw new Error(`${this.name} missing required implementation for canLoadFromOrganization`);
    }

    static async loadFromOrganization (organizationData) {
        throw new Error(`${this.name} missing required implementation for loadFromOrganization`);
    }

    async buildTree (repo) {
        const tree = repo.createTree();

        await Promise.all(
            [...this].map(([name, data]) => {
                const record = this.constructor.normalizeRecord(data);
                const toml = GitSheets.stringifyRecord(record);
                return tree.writeChild(`${name}.toml`, toml);
            })
        );

        return tree;
    }

    static extractName (data) {
        return data.name;
    }

    static extractRecord (data) {
        return data;
    }

    static normalizeRecord (data) {
        // always sort topics
        if (data.topics && Array.isArray(data.topics)) {
            data.topics.sort((a, b) => a.localeCompare(b, undefined, {
                sensitivity: 'base',
                ignorePunctuation: true,
                numeric: true
            }));
        }

        return data;
    }
};
