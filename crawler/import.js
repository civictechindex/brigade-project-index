#!/usr/bin/env node

const path = require('path');
const axios = require('axios');
const csvParser = require('csv-parser');
const GitSheets = require('gitsheets');
const ProgressBar = require('progress');
const parseLinkHeader = require('parse-link-header');

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const CFAPI_FIELDS = ['name', 'description', 'link_url', 'code_url', 'type', 'categories', 'tags', 'organization_name', 'status'];

const githubOrgRegex = new RegExp('^(https?://)?(www\.)?github\.com(/orgs)?/(?<username>[^/]+)/?$');
const { GITHUB_ACTOR: githubActor, GITHUB_TOKEN: githubToken } = process.env;
const githubAxios = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.mercy-preview+json'
    },
    auth: githubActor && githubToken
        ? { username: githubActor, password: githubToken }
        : null
});

require('yargs')
    .command({
        command: '$0',
        desc: 'Import brigade and project data from CfAPI network',
        builder: {
            'orgs-source': {
                describe: 'URL to JSON file listing organizations to scan',
                type: 'string',
                default: 'https://raw.githubusercontent.com/codeforamerica/brigade-information/master/organizations.json'
            },
            orgs: {
                describe: 'Import organizations',
                boolean: true,
                default: false
            },
            projects: {
                describe: 'Import projects',
                boolean: true,
                default: false
            },
            all: {
                describe: 'Import everything',
                boolean: true,
                default: false
            },
            'commit-to': {
                describe: 'A target branch/ref to commit the projected network tree to',
                type: 'string'
            },
            'commit-message': {
                describe: 'A commit message to use if commit-branch is specified',
                type: 'string'
            },
            'commit-orgs-to': {
                describe: 'A target branch/ref to commit the imported orgs tree to',
                type: 'string'
            },
        },
        handler: async argv => {
            const {
                // import sets
                orgs,
                projects,
                all,

                // import options
                orgsSource,

                // commit options
                commitTo,
                commitMessage,
                commitOrgsTo
            } = argv;


            // prepare interfaces
            const sheets = await GitSheets.create();
            const { repo, git } = sheets;


            // gather input
            const loaderCommit = await sheets.repo.resolveRef();
            const commitRef = normalizeRef(commitTo);
            const commitOrgsRef = normalizeRef(commitOrgsTo);


            // prepare output
            let orgsCommit;
            let outputCommit = commitRef && await repo.resolveRef(commitRef)
                || await git.commitTree({ m: 'beginning new index' }, EMPTY_TREE_HASH);
            const outputTree = await repo.createTreeFromRef(outputCommit);


            // load organizations
            if (orgs || all) {

                // load tree from online cfapi repo
                let orgsTree;

                try {
                    console.error('loading orgs tree from cfapi repo...');
                    orgsTree = await loadOrgsTree(repo, orgsSource);
                    console.error('orgs tree loaded');
                } catch (err) {
                    console.error('failed to load organizations:', err);
                    process.exit(1);
                }

                const orgsTreeHash = await orgsTree.write();
                console.error(`orgs tree written: ${orgsTreeHash}`);


                // check for existing orgs commit
                const orgsCommitParent = commitOrgsRef ? await repo.resolveRef(commitOrgsRef) : null;


                // generate intermediary commit of loaded orgs tree, or reuse previous if tree unchanged
                if (
                    orgsCommitParent
                    && await git.getTreeHash(orgsCommitParent) == orgsTreeHash
                ) {
                    orgsCommit = orgsCommitParent;
                } else {
                    orgsCommit = await git.commitTree(orgsTreeHash, {
                        p: orgsCommitParent,
                        m: `📥 imported organizations from cfapi repo\n\nSource-Url: ${orgsSource}\nLoader-Version: ${loaderCommit}`
                    });

                    // optionally write new intermediary orgs commit to ref
                    if (commitOrgsRef) {
                        await git.updateRef(commitOrgsRef, orgsCommit);
                        console.warn(`committed imported orgs tree to ${commitOrgsRef}: ${orgsCommit}`);
                    }
                }


                // merge orgs tree into main index tre
                await outputTree.writeChild('./organizations/', orgsTree);

                // TODO: enrich/normalize/transform orgs tree as desired for index branch

                const outputTreeHash = await outputTree.write();


                // generate commit to index branch if tree has changed
                const outputCommitParents = [
                    outputCommit,
                    orgsCommit
                ];

                if (await git.getTreeHash(outputCommit) != outputTreeHash) {
                    outputCommit = await git.commitTree(
                        {
                            p: outputCommitParents,
                            m: (commitMessage || `🔁 refreshed organizations from cfapi`) + `\n\nLoader-Version: ${loaderCommit}`
                        },
                        outputTreeHash
                    );

                    // optionally commit main index tree into
                    if (commitRef) {
                        await git.updateRef(commitRef, outputCommit);
                        console.warn(`merged new orgs tree into "${commitRef}": ${outputCommitParents.join('+')}->${outputCommit}`);
                    }
                }
            }


            // load projects
            if (projects || all) {

                // get orgs tree to scan
                const orgsTree = await outputTree.getChild('organizations');
                if (!orgsTree) {
                    throw new Error('run with --orgs to generate new orgs tree or with --commit-to set to an index branch with an existing orgs tree');
                }


                // load projects from mixed org sources
                const orgBlobs = await orgsTree.getBlobMap();

                for (const orgBlobName in orgBlobs) {
                    const org = await sheets.parseBlob(orgBlobs[orgBlobName]);
                    const orgName = path.basename(orgBlobName, '.toml');
                    const { projects_list_url: projectsListUrl } = org;

                    if (!projectsListUrl) {
                        console.error(`skipping org with no projects list: ${orgName}`);
                        continue;
                    }

                    let orgProjectsTree;
                    const githubMatch = githubOrgRegex.exec(projectsListUrl);

                    if (githubMatch) {
                        const { username } = githubMatch.groups;
                        orgProjectsTree = await loadGithubProjects(repo, username);

                        if (!orgProjectsTree) {
                            console.error(`skipping empty projects list for ${orgName}: ${projectsListUrl}`);
                            continue;
                        }
                    } else {
                        // fetch curated CSV or jsJSONon feed
                        orgProjectsTree = await loadFeedProjects(repo, projectsListUrl);

                        if (!orgProjectsTree) {
                            console.error(`skipping empty projects list for ${orgName}: ${projectsListUrl}`);
                            continue;
                        }
                    }


                    // merge into output tree
                    await outputTree.writeChild(`projects/${orgName}`, orgProjectsTree);
                    const outputTreeHash = await outputTree.write();


                    // generate commit to index branch if tree has changed
                    if (await git.getTreeHash(outputCommit) != outputTreeHash) {
                        outputCommit = await git.commitTree(
                            {
                                p: outputCommit,
                                m: (commitMessage || `🔁 refreshed projects from ${orgName}`) + `\n\nSource-Url: ${projectsListUrl}\nLoader-Version: ${loaderCommit}\n`
                            },
                            outputTreeHash
                        );

                        // optionally commit main index tree into
                        if (commitRef) {
                            await git.updateRef(commitRef, outputCommit);
                            console.warn(`merged ${orgName} projects tree into "${commitRef}": ${outputCommit}`);
                        }
                    }
                }
            }


            // output final hash to STDOUT
            console.log(outputCommit || await outputTree.write());
        }
    })
    .demandCommand()
    .help()
    .argv;


function normalizeRef(ref) {
    if (!ref) {
        return null;
    }

    if (ref == 'HEAD' || ref.startsWith('refs/')) {
        return ref;
    }

    return `refs/heads/${ref}`;
}

async function loadOrgsTree(repo, orgsSource) {

    // load data from JSON URL
    const { data: orgs } = await axios.get(orgsSource);


    // build tree
    const tree = repo.createTree();
    const progressBar = new ProgressBar('building orgs list :current/:total [:bar] :etas', {
        total: orgs.length
    });

    for (const org of orgs) {
        const orgData = {
            ...org,
            name: null
        };

        // null-out empty strings
        for (const key in orgData) {
            if (orgData[key] === '') {
                orgData[key] = null;
            }
        }

        const toml = GitSheets.stringifyRecord(orgData);
        const blob = await tree.writeChild(`${org.name}.toml`, toml);

        progressBar.tick();
    }


    // return tree
    return tree;
}

async function loadGithubProjects(repo, username) {

    // load repos
    console.error(`loading repos from github.com/${username}...`);
    const repos = [];
    let next = `/users/${username}/repos`;
    let reposProgressBar;

    do {
        let response;

        try {
            response = await githubAxios.get(next);
        } catch (err) {
            console.error(`GitHub request failed: ${err.response ? err.response.data.message || err.response.status : err.message}`);

            if (err.response && err.response.status == 404) {
                return null;
            }

            // GitHub will return 403 when you hit rate limit without auth
            if (err.response && err.response.status == 403) {
                console.error('Try setting GITHUB_ACTOR and GITHUB_TOKEN');
                process.exit(1);
            }

            return null;
        }

        repos.push(...response.data);


        // handle paging
        const links = response.headers.link ? parseLinkHeader(response.headers.link) : {};
        if (links.next) {
            if (!reposProgressBar) {
                reposProgressBar = new ProgressBar(`pages :current/:total [:bar] :etas`, {
                    total: links.last ? parseInt(links.last.page) : 1
                });
            }

            reposProgressBar.tick();
            next = links.next.url;
        } else {
            next = null;

            if (reposProgressBar) {
                reposProgressBar.tick();
            }
        }
    } while (next);


    // build tree
    const tree = repo.createTree();
    const progressBar = new ProgressBar('building projects list :current/:total [:bar] :etas', {
        total: repos.length
    });

    for (const repo of repos) {
        // skip archived
        if (repo.archived) {
            progressBar.tick();
            continue;
        }

        // extract interesting bits of data
        const projectData = {
            code_url: repo.html_url,
            git_url: repo.git_url,
            git_branch: repo.default_branch,
            link_url: repo.homepage || null,
            topics: repo.topics.length ? repo.topics : null
        };
        const toml = GitSheets.stringifyRecord(projectData);
        const blob = await tree.writeChild(`${repo.name}.toml`, toml);

        progressBar.tick();
    }


    // return tree
    return tree;
}

async function loadFeedProjects(repo, projectsListUrl) {

    // auto-prepend http://
    if (!projectsListUrl.match(/^https?:\/\//)) {
        projectsListUrl = `http://${projectsListUrl}`;
    }


    // load response from URL
    console.error(`loading projects from ${projectsListUrl}...`);
    let response;

    try {
        response = await axios.get(projectsListUrl, { responseType: 'stream' });
    } catch (err) {
        console.error(`Feed request failed: ${err.message}`);

        if (err.response && err.response.status == 404) {
            return null;
        }

        return null;
    }


    // read and normalize content type
    let contentType = response.headers['content-type'] || '';

    // look for text/csv or application/json anywhere within the response's Content-Type
    if (contentType.includes('text/csv')) {
        contentType = 'text/csv';
    } else if (contentType.includes('application/json')) {
        contentType = 'application/json';
    } else {
        // if Content-Type wasn't CSV or JSON, see if filename extension in URL is
        const lowerCaseUrl = projectsListUrl.toLowerCase();

        if (lowerCaseUrl.endsWith('.json')) {
            contentType = 'application/json';
        } else if(lowerCaseUrl.endsWith('.csv')) {
            contentType = 'text/csv';
        } else {
            console.error(`Response Content-Type must be text/csv or application/csv, got: ${contentType}`);
            return null;
        }
    }


    // extract projects array from response
    let projects;

    if (contentType == 'text/csv') {
        projects = await new Promise((resolve, reject) => {
            const rows = [];

            response.data
                .pipe(csvParser())
                .on('data', row => rows.push(row))
                .on('end', () => resolve(rows))
                .on('error', reject);
        });
    } else {
        projects = await new Promise((resolve, reject) => {
            const chunks = [];

            response.data
                .on('data', chunk => chunks.push(chunk))
                .on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
                .on('error', reject);
        });
    }


    // build tree
    const tree = repo.createTree();
    const progressBar = new ProgressBar('building projects list :current/:total [:bar] :etas', {
        total: projects.length
    });

    for (const project of projects) {
        // extract interesting bits of data
        const projectData = {};

        if (typeof project == 'string') {
            projectData.code_url = project;
            projectData.name = path.basename(project);
        } else {

            // cfapi mapped these two fields, presumably some systems use it
            if (project.homepage) {
                projectData.link_url = project.homepage;
            }

            if (project.html_url) {
                projectData.code_url = project.html_url;
            }

            // split tags into trimmed array if needed
            if (typeof project.tags == 'string') {
                project.tags = project.tags.trim().split(/\s*,\s*/).filter(tag => tag);
            }

            // extract known CfAPI fields
            for (const sourceKey of CFAPI_FIELDS) {
                const sourceValue = project[sourceKey];

                if (!sourceValue) {
                    continue;
                } else if (Array.isArray(sourceValue) && !sourceValue.length) {
                    continue;
                }

                let destKey = sourceKey;

                if (destKey == 'tags') {
                    destKey = 'topics';
                }

                projectData[destKey] = sourceValue;
            }
        }

        if (!projectData.name) {
            console.error('Skipping project with no name');
            continue;
        }

        let name = projectData.name;
        delete projectData.name;

        // if name can't be written only to path, record as field
        if (name.includes('/')) {
            projectData.name = name;
            name = name.replace(/\//g, '--');
        }

        const toml = GitSheets.stringifyRecord(projectData);
        const blob = await tree.writeChild(`${name}.toml`, toml);

        progressBar.tick();
    }


    // return tree
    return tree;
}
