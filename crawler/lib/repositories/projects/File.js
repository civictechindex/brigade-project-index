const path = require('path');
const logger = require('winston');
const axios = require('axios');
const csvParser = require('csv-parser');

const Projects = require('../Projects.js');

const CFAPI_FIELDS = [
    'name',
    'description',
    'link_url',
    'code_url',
    'type',
    'categories',
    'organization_name',
    'status'
];

/**
 * Gateway to a collection of projects maintained in a file
 * @class
 */
module.exports = class File extends Projects {

    static async canLoadFromOrganization ({ projects_list_url = null }) {
        if (!projects_list_url) {
            return false;
        }

        const {
            status,
            headers: {
                'content-type': contentType
            }
        } = await axios.head(projects_list_url, {
            validateStatus: () => true // don't throw for any status
        });

        if (status != 200) {
            return false;
        }

        if (contentType && contentType.startsWith('text/csv')) {
            return true;
        }

        if (contentType && contentType.startsWith('application/json')) {
            return true;
        }

        // if Content-Type wasn't CSV or JSON, see if filename extension in URL is
        const lowerCaseUrl = projects_list_url.toLowerCase();

        if (lowerCaseUrl.endsWith('.json')) {
            return true;
        }

        if(lowerCaseUrl.endsWith('.csv')) {
            return true;
        }

        return false;
    }

    static async loadFromOrganization ({ projects_list_url = null }) {

        const metadata = { sourceUrl: projects_list_url };

        // load response from URL
        logger.info(`loading projects from ${projects_list_url}...`);
        const {
            status,
            headers: {
                'content-type': contentType
            },
            data
        } = await axios.get(projects_list_url, {
            validateStatus: () => true, // don't throw for any status
            responseType: 'stream'
        });

        if (status != 200) {
            logger.error(`Feed request failed with status ${status}`);
            return null;
        }

        if (contentType && contentType.startsWith('text/csv')) {
            return this.loadFromCsvStream(data, metadata);
        }

        if (contentType && contentType.startsWith('application/json')) {
            return this.loadFromJsonStream(data, metadata);
        }

        // if Content-Type wasn't CSV or JSON, see if filename extension in URL is
        const lowerCaseUrl = projects_list_url.toLowerCase();

        if (lowerCaseUrl.endsWith('.json')) {
            return this.loadFromJsonStream(data, metadata);
        }

        if(lowerCaseUrl.endsWith('.csv')) {
            return this.loadFromCsvStream(data, metadata);
        }

        return null;
    }

    static async loadFromJsonStream (jsonStream, metadata = {}) {
        return new Promise((resolve, reject) => {
            const chunks = [];

            jsonStream
                .on('error', reject)
                .on('data', chunk => chunks.push(chunk))
                .on('end', () => {
                    const projects = new this();
                    projects.metadata = metadata;

                    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                    for (const datum of data) {
                        const name = this.extractName(datum);
                        const record = this.extractRecord(datum);

                        if (name && record) {
                            projects.set(name, record);
                        }
                    }

                    resolve(projects);
                });
        });
    }

    static async loadFromCsvStream (csvStream, metadata = {}) {
        return new Promise((resolve, reject) => {
            const projects = new this();
            projects.metadata = metadata;

            csvStream
                .pipe(csvParser({
                    mapHeaders: ({ header }) => header.trim(),
                    mapValues: ({ value }) => value.trim()
                }))
                .on('error', reject)
                .on('data', row => {
                    const name = this.extractName(row);
                    const record = this.extractRecord(row);

                    if (name && record) {
                        projects.set(name, record);
                    }
                })
                .on('end', () => resolve(projects));
        });
    }

    static extractName (data) {
        let name;

        if (typeof data == 'string') {
            name = path.basename(data);
        } else {
            name = data.name;
        }

        // replace any / with --
        if (name.includes('/')) {
            name = name.replace(/\//g, '--');
        }

        return name || null;
    }

    static extractRecord (data) {
        // extract interesting bits of data
        const record = {};

        if (typeof data == 'string') {
            record.code_url = data;
            record.name = path.basename(data);
        } else {

            // cfapi mapped these two fields, presumably some systems use it
            if (data.homepage) {
                record.link_url = data.homepage;
            }

            if (data.html_url) {
                record.code_url = data.html_url;
            }

            // split tags into trimmed array if needed
            let parsedTopics = [];

            if (typeof data.tags == 'string') {
                parsedTopics = data.tags.trim().split(/\s*,\s*/).filter(tag => tag);
            } else if (Array.isArray(data.tags)) {
                parsedTopics = data.tags;
            }

            if (parsedTopics.length) {
                record.topics = parsedTopics;
            }

            // extract known CfAPI fields
            for (const sourceKey of CFAPI_FIELDS) {
                const sourceValue = data[sourceKey];

                if (!sourceValue) {
                    continue;
                } else if (Array.isArray(sourceValue) && !sourceValue.length) {
                    continue;
                }

                record[sourceKey] = sourceValue;
            }
        }

        return record;
    }
};
