#!/usr/bin/env node

const path = require('path');
const axios = require('axios');
const GitSheets = require('gitsheets');
const ProgressBar = require('progress');
const parseLinkHeader = require('parse-link-header');

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

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
                        console.error(`skipping non-GitHub projects list for ${orgName}: ${projectsListUrl}`);
                        continue;
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
