const tmp = require('tmp-promise');
const GitSheets = require('gitsheets');

const GitHubOrganization = require('../GitHubOrganization.js');
const Projects = require('../../Projects.js');


describe('Projects Repository: GitHub Organization', () => {

    describe('recognizes organizations', () => {

        test('recognizes http url', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'http://github.com/owner-name'
            })).toBeTrue();
        });

        test('recognizes schemaless url', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'github.com/owner-name'
            })).toBeTrue();
        });

        test('recognizes www url', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'http://www.github.com/owner-name'
            })).toBeTrue();
        });

        test('recognizes schemaless www url', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'www.github.com/owner-name'
            })).toBeTrue();
        });

        test('recognizes canonical url', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'https://github.com/owner-name'
            })).toBeTrue();
        });

        test('recognizes canonical url w/ trailing slash', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'https://github.com/owner-name/'
            })).toBeTrue();
        });

        test('recognizes orgs url', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'https://github.com/orgs/owner-name'
            })).toBeTrue();
        });

        test('recognizes orgs url w/ trailing slash', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'https://github.com/orgs/owner-name/'
            })).toBeTrue();
        });

        test('does not recognize GitLab url', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'https://gitlab.com/owner-name/repo-name'
            })).toBeFalse();
        });

        test('does not recognize repository URL', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'https://github.com/owner-name/repo-name'
            })).toBeFalse();
        });

        test('does not recognize orgs sub-page', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'https://github.com/orgs/owner-name/people'
            })).toBeFalse();
        });

        test('does not recognize topics page', async () => {
            expect(await GitHubOrganization.canLoadFromOrganization({
                projects_list_url: 'https://github.com/topics/topic-name'
            })).toBeFalse();
        });
    });

    describe('snapshots projects', () => {
        let projects;

        test('loads from Code for Philly organization', async () => {
            projects = await GitHubOrganization.loadFromOrganization({
                projects_list_url: 'https://github.com/CodeForPhilly'
            });
            expect(projects).toBeInstanceOf(GitHubOrganization);
            expect(projects).toBeInstanceOf(Projects);
        });
5
        test('has > 80 projects', () => {
            expect(projects).toBeInstanceOf(Map);
            expect(projects.size).toBeGreaterThan(80);
        });

        test('does not have archived adopt-a-hydrant', () => {
            expect(projects.has('adopt-a-hydrant')).toBeFalse();
        });

        test('has laddr', () => {
            expect(projects.has('laddr')).toBeTrue();

            const laddr = projects.get('laddr');
            expect(laddr).toBeObject();
            expect(laddr).toHaveProperty('git_url', 'git://github.com/CodeForPhilly/laddr.git');
            expect(laddr).toContainKeys([
                'name',
                'description',
                'topics',
                'link_url',
                'code_url',
                'git_url'
            ]);

            expect(projects.constructor.normalizeRecord(laddr)).toContainAllKeys([
                'name',
                'description',
                'topics',
                'link_url',
                'code_url',
                'git_url',

                'github',
            ]);
        });

        test('writes to tree', async () => {
            const gitDir = await tmp.dir({ unsafeCleanup: true });
            const sheets = await GitSheets.create(gitDir.path);
            const { repo, git } = sheets;

            const expectedFilenames = [...projects.keys()].map(name => `${name}.toml`);

            await git.init();
            const tree = await projects.buildTree(repo);
            expect(tree.isTree).toBeTrue();

            const treeChildren = await tree.getChildren();
            expect(treeChildren).toContainAllKeys(expectedFilenames);

            const treeHash = await tree.write();
            expect(treeHash).toBeString();
            expect(treeHash.length).toBe(40);

            const treeContents = await git.lsTree(treeHash, { 'name-only': true, z: true });
            const treeFilenames = treeContents.substr(0, treeContents.length-1).split('\0');
            expect(treeFilenames).toIncludeSameMembers(expectedFilenames);

            await gitDir.cleanup();
        });

    });

});
