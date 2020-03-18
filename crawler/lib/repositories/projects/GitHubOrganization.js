const logger = require('winston');
const parseLinkHeader = require('parse-link-header');

const Projects = require('../Projects.js');
const github = require('../../connections/github.js');

const urlRegex = new RegExp('^(https?://)?(www\.)?github\.com(/orgs)?/(?<ownerName>[^/?]+)/?$');

/**
 * Gateway to a collection of projects maintained within a GitHub organization
 * @class
 */
module.exports = class GitHubOrganization extends Projects {

    static async canLoadFromOrganization ({ projects_list_url = null }) {
        if (!projects_list_url) {
            return false;
        }

        return urlRegex.test(projects_list_url);
    }

    static async loadFromOrganization (organizationData) {
        const { ownerName } = urlRegex.exec(organizationData.projects_list_url).groups;
        return this.loadFromOwner(ownerName);
    }

    static async loadFromOwner (ownerName) {
        const projects = new this();

        // load repos
        let next = `/users/${ownerName}/repos`;
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
            for (const repository of response.data) {
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
        return {
            name: data.name,
            code_url: data.html_url,
            description: data.description,
            git_url: data.git_url,
            git_branch: data.default_branch,
            link_url: data.homepage || null,
            topics: data.topics.length ? data.topics : null
        };
    }
};
