#!/usr/bin/env node

const Gitsheets = require('gitsheets');

outputResult(build(process.env.HOLOLENS_INPUT));

async function build (inputTreeHash) {

    // prepare interfaces
    const gitsheets = await Gitsheets.create();


    // prepare output
    const outputTree = gitsheets.repo.createTree();


    // read through all records and write data into output tree
    console.error(`Reading records from tree: ${inputTreeHash}`);
    const recordsStream = await gitsheets.export(inputTreeHash);

    await new Promise ((resolve, reject) => {
        const promises = [];

        let lastPrefixLogged;
        recordsStream
            .on('data', (record) => {
                const recordPath = record._path;
                delete record._path;

                if (recordPath.startsWith('organizations/')) {
                    const [, orgName] = recordPath.split('/');

                    // detect switch in record type
                    if (lastPrefixLogged != 'organizations') {
                        console.error('Reading organizations...');
                        lastPrefixLogged = 'organizations';
                    }

                    // write full record to canonical path
                    promises.push(
                        outputTree.writeChild(`organizations/${orgName}.json`, JSON.stringify({
                            data: {
                                type: 'organization',
                                id: orgName,
                                attributes: record
                            }
                        }))
                    );
                } else if (recordPath.startsWith('projects/')) {
                    const [, orgName, projectName] = recordPath.split('/');

                    // detect switch in record type
                    if (lastPrefixLogged != 'projects') {
                        console.error('Reading projects...');
                        lastPrefixLogged = 'projects';
                    }

                    // write full record to canonical path
                    promises.push(
                        outputTree.writeChild(`organizations/${orgName}/${projectName}.json`, JSON.stringify({
                            data: {
                                type: 'project',
                                id: `${orgName}/${projectName}`,
                                attributes: record
                            }
                        }))
                    );
                }
            })
            .on('end', () => Promise.all(promises).then(resolve).catch(reject))
            .on('error', reject);
    });


    return outputTree;
}

async function outputResult(result) {
    result = await result;

    if (result.isTree) {
        const treeHash = await result.write();
        console.log(treeHash);
        process.exit(0);
        return;
    }

    console.error('no result');
    process.exit(1);
}
