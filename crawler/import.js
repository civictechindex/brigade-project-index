#!/usr/bin/env node

const GitSheets = require('gitsheets');

require('yargs')
    .command({
        command: '$0',
        desc: 'Import brigade data from CfAPI network',
        builder: {
            brigades: {
                describe: 'Import brigades',
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
            append: {
                describe: 'Whether to layer imported data on top of current',
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
            const { brigades, projects, all, commitTo, commitMessage, append } = argv;

            const sheets = await GitSheets.create();
            const tree = sheets.repo.createTree();

            if (append) {
                // TODO: load an existing tree instead
                throw new Error('append is not yet implemented');
            }

            if (brigades || all) {
                let outputHash;
                try {
                    outputHash = await importBrigades(tree, argv);
                    console.error('tree ready');
                } catch (err) {
                    console.error('failed to import brigades:', err);
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
                            m: commitMessage || `🔁 imported`
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

async function importBrigades(tree, argv) {
    return '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
}