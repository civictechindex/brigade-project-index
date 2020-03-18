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
                const record = this.buildRecord(data);
                const toml = GitSheets.stringifyRecord(record);
                return tree.writeChild(`${name}.toml`, toml);
            })
        );

        return tree;
    }

    buildRecord (data) {
        return data;
    }
};
