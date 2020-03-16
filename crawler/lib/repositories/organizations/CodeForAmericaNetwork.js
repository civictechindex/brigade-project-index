const logger = require('winston');

const Organizations = require('../Organizations.js');


/**
 * Gateway to a collection of Code for America Network Organizations
 * @class
 */
module.exports = class CodeForAmericaNetwork extends Organizations {

    static async loadFromUrl (url = null) {
        const axios = require('axios');

        // choose URL
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
        const organizations = new CodeForAmericaNetwork();

        for (const org of organizationsArray) {
            // null-out empty strings
            for (const key in org) {
                if (org[key] === '') {
                    org[key] = null;
                }
            }

            organizations.set(org.name, org);
        }

        return organizations;
    }
};
