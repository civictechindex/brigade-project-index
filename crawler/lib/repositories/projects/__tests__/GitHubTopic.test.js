const tmp = require('tmp-promise');
const GitSheets = require('gitsheets');

const GitHubTopic = require('../GitHubTopic.js');
const Projects = require('../../Projects.js');


describe('Projects Repository: GitHub Topic', () => {

    describe('recognizes organizations', () => {

        test('recognizes projects tag', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_tag: 'topic-name'
            })).toBeTrue();
        });

        test('recognizes http url', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'http://github.com/topics/topic-name'
            })).toBeTrue();
        });

        test('recognizes http url w/ projects tag', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'http://github.com/topics/topic-name',
                projects_tag: 'topic-name'
            })).toBeTrue();
        });

        test('recognizes schemaless url', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'github.com/topics/topic-name'
            })).toBeTrue();
        });

        test('recognizes www url', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'http://www.github.com/topics/topic-name'
            })).toBeTrue();
        });

        test('recognizes schemaless www url', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'www.github.com/topics/topic-name'
            })).toBeTrue();
        });

        test('recognizes canonical url', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'https://github.com/topics/topic-name'
            })).toBeTrue();
        });

        test('recognizes canonical url w/ trailing slash', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'https://github.com/topics/topic-name/'
            })).toBeTrue();
        });

        test('does not recognize GitLab url', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'https://gitlab.com/explore/projects?tag=topic-name'
            })).toBeFalse();
        });

        test('does not recognize organization URL', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'https://github.com/owner-name'
            })).toBeFalse();
        });

        test('does not recognize organization URL w/ projects tag', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'https://github.com/owner-name',
                projects_tag: 'topic-name'
            })).toBeFalse();
        });

        test('does not recognize repository URL', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'https://github.com/owner-name/repo-name'
            })).toBeFalse();
        });

        test('does not recognize filtered topics page', async () => {
            expect(await GitHubTopic.canLoadFromOrganization({
                projects_list_url: 'https://github.com/topics/topic-name?l=language-name'
            })).toBeFalse();
        });
    });

    describe('snapshots projects', () => {
        let projects;

        test('loads from Hack for LA organization', async () => {
            projects = await GitHubTopic.loadFromOrganization({
                projects_tag: 'hack-for-la'
            });
            expect(projects).toBeInstanceOf(GitHubTopic);
            expect(projects).toBeInstanceOf(Projects);
        });

        test('has > 20 projects', () => {
            expect(projects).toBeInstanceOf(Map);
            expect(projects.size).toBeGreaterThan(20);
        });

        test('has website', () => {
            expect(projects.has('website')).toBeTrue();

            const website = projects.get('website');
            expect(website).toBeObject();
            expect(website).toHaveProperty('git_url', 'git://github.com/hackforla/website.git');
            expect(website).toContainKeys([
                'name',
                'description',
                'topics',
                'link_url',
                'code_url',
                'git_url'
            ]);

            expect(projects.constructor.normalizeRecord(website)).toContainAllKeys([
                'name',
                'description',
                'topics',
                'link_url',
                'code_url',
                'git_url',

                // TODO: swap
                // 'github',
                'git_branch'
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
