#!/usr/bin/env node

const axios = require('axios');
const GitSheets = require('gitsheets');
const ProgressBar = require('progress');

require('yargs')
    .command({
        command: '$0',
        desc: 'Import brigade and project data from CfAPI network',
        builder: {
            'organizations-source': {
                describe: 'URL to JSON file listing organizations to scan',
                type: 'string',
                default: 'https://raw.githubusercontent.com/codeforamerica/brigade-information/master/organizations.json'
            },
            organizations: {
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
                describe: 'A target branch/ref to commit the imported tree to',
                type: 'string'
            },
            'commit-message': {
                describe: 'A commit message to use if commit-branch is specified',
                type: 'string'
            },
        },
        handler: async argv => {
            const {
                // import sets
                organizations,
                projects,
                all,

                // import options
                organizationsSource,

                // commit options
                commitTo,
                commitMessage
            } = argv;


            // prepare interfaces
            const sheets = await GitSheets.create();
            const { repo, git } = sheets;


            // gather input
            const toolsCommit = await sheets.repo.resolveRef();

            const commitRef = commitTo
                ? (
                    commitTo == 'HEAD' || commitTo.startsWith('refs/')
                    ? commitTo
                    : `refs/heads/${commitTo}`
                )
                : null;

            const inputCommit = await repo.resolveRef(commitRef);

            const tree = inputCommit
                ? await repo.createTreeFromRef(inputCommit)
                : repo.createTree();


            // prepare output
            let organizationsTree, projectsTree, outputCommit;

            if (organizations || all) {
                try {
                    organizationsTree = await buildOrganizationsTree(repo, organizationsSource);
                    console.error('tree ready');
                } catch (err) {
                    console.error('failed to import organizations:', err);
                    process.exit(1);
                }

                tree.merge(organizationsTree, { mode: 'replace' }, './organizations/');

                if (commitRef) {
                    const parents = [
                        outputCommit || inputCommit,
                        toolsCommit
                    ];

                    outputCommit = await git.commitTree(
                        {
                            p: parents,
                            m: (commitMessage || `🔁 imported organizations`) + `\n\nOrganizations-Source: ${organizationsSource}`
                        },
                        await tree.write()
                    );

                    await git.updateRef(commitRef, outputCommit);
                    console.warn(`committed new tree to "${commitRef}": ${parents.join('+')}->${outputCommit}`);
                }
            }

            console.log(outputCommit || await tree.write());
        }
    })
    .demandCommand()
    .help()
    .argv;

async function buildOrganizationsTree(repo, organizationsSource) {

    // load data from JSON URL
    const { data: organizations } = await axios.get(organizationsSource);


    // build tree
    const tree = repo.createTree();
    const progressBar = new ProgressBar('loading organizations :percent [:bar] :rate/s :etas', { total: organizations.length });

    for (const organization of organizations) {
        const organizationData = {
            ...organization,
            name: null
        };
        const toml = GitSheets.stringifyRecord(organizationData);
        const blob = await tree.writeChild(`${organization.name}.toml`, toml);

        progressBar.tick();
    }


    // write tree
    return tree;
}
