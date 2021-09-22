const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_WEEK = ONE_DAY * 7;
const ONE_MONTH = ONE_DAY * 30;
const ONE_YEAR = ONE_DAY * 365;

const excludedProperties = [
    'size',

    // duplicated by *_count properties
    'forks',
    'open_issues',
    'watchers'
];

const bucketedCountProperties = {
    forks_count: [0, 10, 100, 1000],
    open_issues_count: [0, 10, 100, 1000],
    stargazers_count: [0, 10, 100, 1000],
    watchers_count: [0, 10, 100, 1000],
};

const bucketedTimestampProperties = {
    pushed_at: {
        week: new Date(Date.now() - ONE_WEEK),
        month: new Date(Date.now() - ONE_MONTH),
        year: new Date(Date.now() - ONE_YEAR)
    },
    updated_at: {
        week: new Date(Date.now() - ONE_WEEK),
        month: new Date(Date.now() - ONE_MONTH),
        year: new Date(Date.now() - ONE_YEAR)
    },
};

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

            if (excludedProperties.indexOf(key) !== -1) {
                continue;
            }

            const value = objectData[key];

            if (value === null || value === undefined) {
                continue;
            }

            // bucket counters
            if (bucketedCountProperties.hasOwnProperty(key)) {
                const buckets = bucketedCountProperties[key];
                let valueBucket = null;

                for (const bucket of buckets) {
                    if (value <= bucket) {
                        valueBucket = bucket;
                        break;
                    }
                }

                output[key.replace(/_count$/, '_within')] = valueBucket === null
                    ? 'over_'+buckets[buckets.length-1]
                    : valueBucket;

                continue;
            }

            // bucket timestamps
            if (bucketedTimestampProperties.hasOwnProperty(key)) {
                const buckets = bucketedTimestampProperties[key];
                const timestamp = new Date(value);
                let timestampBucket = null, lastBucket = null;

                for (const bucket in buckets) {
                    if (timestamp >= buckets[bucket]) {
                        timestampBucket = bucket;
                        break;
                    }
                    lastBucket = bucket;
                }

                output[key.replace(/_at$/, '_within')] = timestampBucket === null
                    ? 'over_a_'+lastBucket
                    : timestampBucket;

                continue;
            }

            // map sub-objects
            if (typeof value == 'object' && !Array.isArray(value)) {
                output[key] = GitHubRepository.extractInterestingData(value);
            } else {
                output[key] = value;
            }
        }

        return output;
    }
};
