const logger = require('winston');

const Organizations = require('../Organizations.js');


/**
 * Gateway to a collection of Code for America Network Organizations
 * @class
 */
module.exports = class CodeForAmericaNetwork extends Organizations {

    static async loadFromUrl (url = null) {
        // load from local file
        if (url && url.startsWith('file:///')) {
            const fs = require('fs');

            const filePath = url.substr(7);

            logger.info(`loading Code for America Network organizations from local file ${filePath}`);
            const cfaList = JSON.parse(fs.readFileSync(filePath));
            logger.debug(`loaded ${cfaList.length} organizations`);

            return CodeForAmericaNetwork.loadFromArray(cfaList);
        }


        // load from web
        const axios = require('axios');

        if (!url) {
            url = process.env.CFA_ORGANIZATIONS_URL;
        }

        if (!url) {
            url = 'https://raw.githubusercontent.com/codeforamerica/brigade-information/master/organizations.json';
        }


        // load data from JSON URL
        logger.info(`loading Code for America Network organizations from ${url}`);
        const { data: cfaList } = await axios.get(url);
        logger.debug(`loaded ${cfaList.length} organizations`);

        return CodeForAmericaNetwork.loadFromArray(cfaList);
    }

    static async loadFromArray (organizationsArray) {
        const organizations = new this();

        for (const org of organizationsArray) {
            // null-out empty strings
            for (const key in org) {
                if (org[key] === '') {
                    org[key] = null;
                }
            }

            const orgName = this.extractName(org);

            if (orgName) {
                organizations.set(orgName, this.extractRecord(org));
            }
        }

        return organizations;
    }
};
