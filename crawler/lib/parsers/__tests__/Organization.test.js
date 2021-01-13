const Organization = require('../Organization.js');
const GitHubOrganization = require('../../repositories/projects/GitHubOrganization.js');
const GitHubTopic = require('../../repositories/projects/GitHubTopic.js');
const File = require('../../repositories/projects/File.js');
const Projects = require('../../repositories/Projects.js');

describe('Organization Parser', () => {
    test('load projects from GitHub organization', async () => {
        const projects = await Organization.loadProjects({
            projects_list_url: 'https://github.com/codeforabq'
        });
        expect(projects).toBeInstanceOf(GitHubOrganization);
        expect(projects).toBeInstanceOf(Projects);
    });

    test('load projects from GitHub topic', async () => {
        const projects = await Organization.loadProjects({
            projects_list_url: 'https://github.com/topics/hack-for-la'
        });
        expect(projects).toBeInstanceOf(GitHubTopic);
        expect(projects).toBeInstanceOf(Projects);
    });

    test('load projects from file', async () => {
        const projects = await Organization.loadProjects({
            projects_list_url: 'https://raw.github.com/open-city/civic-json-files/master/projects.json'
        });
        expect(projects).toBeInstanceOf(File);
        expect(projects).toBeInstanceOf(Projects);
    });
});
