const logger = require('winston');
const parseLinkHeader = require('parse-link-header');

const Projects = require('../Projects.js');
const github = require('../../connections/github.js');

const urlRegex = new RegExp('^(https?://)?(www\.)?github\.com/topics/(?<topic>[^/?]+)/?$');

/**
 * Gateway to a collection of projects maintained within a GitHub organization
 * @class
 */
module.exports = class GitHubTopic extends Projects {

    static async canLoadFromOrganization ({ projects_list_url = null, projects_tag = null }) {
        if (projects_list_url && urlRegex.test(projects_list_url)) {
            return true;
        }

        if (projects_tag && !projects_list_url) {
            return true;
        }

        return false;
    }

    static async loadFromOrganization (organizationData) {
        const { projects_list_url: url, projects_tag: tag } = organizationData;
        const urlMatch = url && urlRegex.exec(ourl);

        let topic;
        if (urlMatch) {
            ({ topic } = urlMatch.groups);
        } else if (tag) {
            topic = tag;
        } else {
            throw new Error('organization has neither projects_tag or parsable projects_list_url');
        }

        return this.loadFromTopic(topic);
    }

    static async loadFromTopic (topic) {
        const projects = new this();

        // load repos
        let next = `/search/repositories?q=topic:${topic}`;
        let pageNumber = 1;

        projects.sourceUrl = `github.com${next}`;
        logger.info(`loading repos from ${projects.sourceUrl}...`);

        do {
            // load 1 page of repositories from  GitHub API
            let response;

            try {
                response = await github.get(next);
            } catch (err) {
                logger.error(`GitHub request failed: ${err.response ? err.response.data.message || err.response.status : err.message}`);

                if (err.response && err.response.status == 404) {
                    return null;
                }

                // GitHub will return 403 when you hit rate limit without auth
                if (err.response && err.response.status == 403) {
                    logger.error('hit GitHub rate limit, try setting GITHUB_ACTOR and GITHUB_TOKEN');
                    process.exit(1);
                }

                return null;
            }


            // load whole page into collection, keyed by name
            for (const repository of response.data.items) {
                projects.set(repository.name, repository);
            }


            // loop onto next page if GitHub provides link in response headers
            const links = response.headers.link ? parseLinkHeader(response.headers.link) : {};

            if (links.next && links.next.url) {
                next = links.next.url;
                pageNumber++;
                logger.info(`...loading page ${pageNumber}...`);
                continue;
            }


            // no next page, no loop
            break;

        } while (true);

        // TODO: extract interesting bits here, or capture whole github blob?

        return projects;
    }

    buildRecord (data) {
        return super.buildRecord({
            name: data.name,
            code_url: data.html_url,
            description: data.description,
            git_url: data.git_url,
            git_branch: data.default_branch,
            link_url: data.homepage || null,
            topics: data.topics.length ? data.topics : null
        });
    }
};
