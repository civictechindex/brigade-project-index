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

            const sheets = await GitSheets.create();
            const tree = sheets.repo.createTree();

            if (organizations || all) {
                let outputHash;
                try {
                    outputHash = await importOrganizations(tree, organizationsSource);
                    console.error('tree ready');
                } catch (err) {
                    console.error('failed to import organizations:', err);
                    process.exit(1);
                }

                if (commitTo) {
                    const commitRef = commitTo == 'HEAD' || commitTo.startsWith('refs/')
                        ? commitTo
                        : `refs/heads/${commitTo}`;

                    const parents = [
                        await sheets.repo.resolveRef(commitRef),
                        await sheets.repo.resolveRef()
                    ];

                    const git = await sheets.repo.getGit();

                    outputHash = await git.commitTree(
                        {
                            p: parents,
                            m: (commitMessage || `🔁 imported organizations`) + `\n\nOrganizations-Source: ${organizationsSource}`
                        },
                        outputHash
                    );

                    await git.updateRef(commitRef, outputHash);
                    console.warn(`committed new tree to "${commitRef}": ${parents.join('+')}->${outputHash}`);
                }

                console.log(outputHash);
            }
        }
    })
    .demandCommand()
    .help()
    .argv;

async function importOrganizations(tree, organizationsSource) {

    // load data from JSON URL
    const { data: organizations } = await axios.get(organizationsSource);


    // build tree
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
    return await tree.write();
}