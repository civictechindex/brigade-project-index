const GitSheets = require('gitsheets');


/**
 * Gateway to a collection of organizations
 * @class
 */
module.exports = class Organizations extends Map {

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
        return data;
    }
};
