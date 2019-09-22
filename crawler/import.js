#!/usr/bin/env node

const axios = require('axios');
const GitSheets = require('gitsheets');
const ProgressBar = require('progress');

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

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
            const toolsCommit = await sheets.repo.resolveRef();
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
                        m: `📥 imported organizations from cfapi repo\n\nSource-Url: ${orgsSource}\nImporter-Version: ${toolsCommit}`
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
                            m: (commitMessage || `🔁 refreshed organizations from cfapi`) + `\n\nImporter-Version: ${toolsCommit}`
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
        const toml = GitSheets.stringifyRecord(orgData);
        const blob = await tree.writeChild(`${org.name}.toml`, toml);

        progressBar.tick();
    }


    // write tree
    return tree;
}
