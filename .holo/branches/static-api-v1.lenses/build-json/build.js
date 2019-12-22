#!/usr/bin/env node

const Gitsheets = require('gitsheets');

outputResult(build(process.env.HOLOLENS_INPUT));

async function build (inputTreeHash) {

    // prepare interfaces
    const gitsheets = await Gitsheets.create();


    // prepare output
    const outputTree = gitsheets.repo.createTree();


    // initialize accumulators
    const organizationsIndex = [];
    const projectsIndex = [];
    const orgProjectsIndexes = {};


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
                    const resourcePath = `organizations/${orgName}.json`;
                    const resourceIdentifier = {
                        type: 'organization',
                        id: orgName,
                        links: {
                            self: `/${resourcePath}`
                        }
                    };


                    // detect switch in record type
                    if (lastPrefixLogged != 'organizations') {
                        console.error('Reading organizations...');
                        lastPrefixLogged = 'organizations';
                    }


                    // write full record to canonical path
                    promises.push(
                        outputTree.writeChild(resourcePath, JSON.stringify({
                            data: {
                                ...resourceIdentifier,
                                attributes: record
                            }
                        }))
                    );


                    // add to global index
                    organizationsIndex.push({
                        ...resourceIdentifier,
                        attributes: {
                            name: orgName
                        }
                    });
                } else if (recordPath.startsWith('projects/')) {
                    const [, orgName, projectName] = recordPath.split('/');
                    const resourcePath = `organizations/${orgName}/${projectName}.json`;
                    const resourceIdentifier = {
                        type: 'project',
                        id: `${orgName}/${projectName}`,
                        links: {
                            self: `/${resourcePath}`
                        }
                    };
                    const relationships = {
                        organization: {
                            data: {
                                type: 'organization',
                                id: orgName
                            },
                            links: {
                                related: `/organizations/${orgName}.json`
                            }
                        }
                    };


                    // detect switch in record type
                    if (lastPrefixLogged != 'projects') {
                        console.error('Reading projects...');
                        lastPrefixLogged = 'projects';
                    }


                    // write full record to canonical path
                    promises.push(
                        outputTree.writeChild(resourcePath, JSON.stringify({
                            data: {
                                ...resourceIdentifier,
                                attributes: record,
                                relationships
                            }
                        }))
                    );


                    // add to global index
                    projectsIndex.push({
                        ...resourceIdentifier,
                        attributes: {
                            name: projectName
                        },
                        relationships
                    });


                    // add to org index
                    if (!(orgName in orgProjectsIndexes)) {
                        orgProjectsIndexes[orgName] = [];
                    }

                    orgProjectsIndexes[orgName].push({
                        ...resourceIdentifier,
                        attributes: {
                            name: projectName
                        }
                    });
                }
            })
            .on('end', () => {
                // write global index files
                promises.push(
                    outputTree.writeChild(`organizations.json`, JSON.stringify({
                        data: organizationsIndex
                    })),
                    outputTree.writeChild(`projects.json`, JSON.stringify({
                        data: projectsIndex
                    }))
                );

                // write organization index files
                for (const orgName in orgProjectsIndexes) {
                    promises.push(
                        outputTree.writeChild(`organizations/${orgName}/projects.json`, JSON.stringify({
                            data: orgProjectsIndexes[orgName]
                        }))
                    );
                }

                // finish when all promises are resolved
                Promise.all(promises).then(resolve).catch(reject);
            })
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
