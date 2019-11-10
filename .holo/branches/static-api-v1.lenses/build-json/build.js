#!/usr/bin/env node

const Gitsheets = require('gitsheets');

build(process.env.HOLOLENS_INPUT);

async function build (inputTreeHash) {

    // prepare interfaces
    const gitsheets = await Gitsheets.create();
    const { repo, git } = gitsheets;


    // prepare output
    const outputTree = repo.createTree();


    // read through all records and write data into output tree
    const recordsStream = await gitsheets.getRows(inputTreeHash);
    await new Promise ((resolve, reject) => {
        const records = {};
        const promises = [];

        recordsStream
            .on('data', (row) => {
                records[row._path] = row;
                debugger;
                outputTree;
                if (row._path.startsWith('organizations/')) {
                    const orgName = row._path.substr(14);
                    const writePromise = outputTree.writeChild(`${orgName}.json`, JSON.stringify(row));
                    promises.push(writePromise);
                }
            })
            .on('end', () => Promise.all(promises).then(resolve).catch(reject))
            .on('error', reject);
    });

    debugger;

    // const fs = require('fs');

    // fs.mkdirSync('./dist');
    // fs.writeFileSync('./dist/hello.md', '# Hello World');


    process.exit(123);
}