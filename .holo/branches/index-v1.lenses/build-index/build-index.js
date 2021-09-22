#!/usr/bin/env node

// const Gitsheets = require('gitsheets');
const Repository = require('gitsheets/lib/Repository')

outputResult(build(process.env.HOLOLENS_INPUT));

async function build (inputTreeHash) {

    // load input tree + sheets
    const repo = await Repository.getFromEnvironment({ ref: inputTreeHash });
    const workspace = await repo.getWorkspace();
    const snapshot = await repo.openSheets();

    // prepare output tree
    const outputTree = repo.createTree();

    // copy .gitsheets/ to output tree
    await outputTree.writeChild('.gitsheets', await workspace.root.getChild('.gitsheets'));

    // copy organizations/ to output tree
    await outputTree.writeChild('organizations', await workspace.root.getChild('organizations'));

    // open sheets interface
    const index = await repo.openSheets({ dataTree: outputTree });

    // copy projects
    for await (const project of snapshot.projects.query()) {
        if (!project.organization_name) {
            console.error(`skipping project ${project.name} with no organization_name`);
            continue;
        }

        const topics = new Set(project.topics);

        if (project.github && project.github.topics) {
            for (const topic of project.github.topics) {
                topics.add(topic);
            }
        }

        const { path } = await index.projects.upsert({
            organization_name: project.organization_name,
            name: project.name,

            description: project.description,
            topics: topics.size ? [...topics] : null,
            status: project.status,

            code_url: project.code_url,
            git_url: project.git_url,
            link_url: project.link_url,

            flags: project.github === false ? [ 'github_404' ] : null,
            git_branch: project.github && project.github.default_branch || null,
            last_pushed_within: project.github && project.github.pushed_within || null,
            open_issues_within: project.github && project.github.open_issues_within || null,
        });

        // console.error(`indexed ${path}`);
    }

    // return output
    const otherWorkspace = await repo.getWorkspace();
    const otherTreeHash = await otherWorkspace.root.write();
    const treeHash = await outputTree.write();

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
