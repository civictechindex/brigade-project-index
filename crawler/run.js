#!/usr/bin/env node

const path = require('path');
const GitSheets = require('gitsheets');

const CodeForAmericaNetwork = require('./lib/repositories/organizations/CodeForAmericaNetwork.js');
const Organization = require('./lib/parsers/Organization.js');
const decorateProject = require('./lib/decorators');

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

// prepare logger
const logger = require('winston');


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
            'scratch-git-dir': {
                describe: 'Path to a directory to use as a persistent scratch git repository',
                type: 'string'
            },
            debug: {
                describe: 'Enable more verbose output',
                type: 'boolean',
                default: false
            }
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
                commitOrgsTo,

                // run options
                scratchGitDir = process.env.SCRATCH_GIT_DIR || null,
                debug,
            } = argv;


            // configure logger
            logger.add(new logger.transports.Console({
                level: process.env.DEBUG || debug ? 'debug' : 'info',
                stderrLevels: Object.keys(logger.config.npm.levels),
                format: logger.format.combine(
                    logger.format.colorize(),
                    logger.format.simple()
                )
            }));


            // configure scratch git dir
            if (scratchGitDir) {
                await require('./lib/ScratchGit.js').setPersistentGitDir(scratchGitDir);
            }


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
                    const organizations = await CodeForAmericaNetwork.loadFromUrl(orgsSource);
                    orgsTree = await organizations.buildTree(repo);
                } catch (err) {
                    logger.error(`failed to load organizations from ${orgsSource}: ${err}`);
                    process.exit(1);
                }

                const orgsTreeHash = await orgsTree.write();
                logger.info(`orgs tree written: ${orgsTreeHash}`);


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
                        logger.info(`committed imported orgs tree to ${commitOrgsRef}: ${orgsCommit}`);
                    }
                }


                // merge orgs tree into main index tre
                await outputTree.writeChild('./organizations/', orgsTree);
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
                        logger.info(`merged new orgs tree into "${commitRef}": ${outputCommitParents.join('+')}->${outputCommit}`);
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


                    // load all projects for given org, delegating to the first Projects Repository implementation that accepts the job
                    let orgProjects;

                    try {
                        orgProjects = await Organization.loadProjects(org);
                    } catch (err) {
                        logger.error(`failed to load projects for ${org.name} from ${org.projects_list_url}: ${err}, skipping organization...`);
                        continue;
                    }

                    if (!orgProjects) {
                        logger.warn(`no projects loader is able to handle organization '${orgName}', skipping organization...`);
                        continue;
                    }


                    // apply organization_name to every project
                    for (const projectData of orgProjects.values()) {
                        projectData.organization_name = orgName;
                    }


                    // apply decorators to all projects
                    logger.debug('applying decorators');
                    await Promise.all([...orgProjects.values()].map(decorateProject));



                    // write projects list to git tree
                    const orgProjectsTree = await orgProjects.buildTree(repo);
                    await outputTree.writeChild(`projects/${orgName}`, orgProjectsTree);
                    const outputTreeHash = await outputTree.write();


                    // generate commit to index branch if tree has changed
                    if (await git.getTreeHash(outputCommit) != outputTreeHash) {
                        outputCommit = await git.commitTree(
                            {
                                p: outputCommit,
                                m: (commitMessage || `🔁 refreshed projects from ${orgName}`) + `\n\nSource-Url: ${orgProjects.metadata.sourceUrl||'␀'}\nLoader-Version: ${loaderCommit}\n`
                            },
                            outputTreeHash
                        );

                        // optionally commit main index tree into
                        if (commitRef) {
                            await git.updateRef(commitRef, outputCommit);
                            logger.info(`merged ${orgName} projects tree into "${commitRef}": ${outputCommit}`);
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
