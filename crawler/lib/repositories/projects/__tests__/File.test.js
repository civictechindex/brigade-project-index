const tmp = require('tmp-promise');
const GitSheets = require('gitsheets');

const File = require('../File.js');
const Projects = require('../../Projects.js');


describe('Projects Repository: File Url', () => {

    describe('recognizes organizations', () => {

        test('recognizes CSV content-type', async () => {
            expect(await File.canLoadFromOrganization({
                projects_list_url: 'http://www.mocky.io/v2/5e6eeabf3300003700f075da'
            })).toBeTrue();
        });

        test('recognizes JSON content-type', async () => {
            expect(await File.canLoadFromOrganization({
                projects_list_url: 'http://www.mocky.io/v2/5e6eea9c3300004e00f075d8'
            })).toBeTrue();
        });

        test('recognizes JSON url with generic content-type', async () => {
            expect(await File.canLoadFromOrganization({
                projects_list_url: 'http://www.mocky.io/v2/5e6eeb1c3300005f00f075dd/filename.json'
            })).toBeTrue();
        });

        test('recognizes CSV url with generic content-type', async () => {
            expect(await File.canLoadFromOrganization({
                projects_list_url: 'http://www.mocky.io/v2/5e6eeb1c3300005f00f075dd/filename.csv'
            })).toBeTrue();
        });

        test('does not recognize extensionless url with generic content-type', async () => {
            expect(await File.canLoadFromOrganization({
                projects_list_url: 'http://www.mocky.io/v2/5e6eeb1c3300005f00f075dd'
            })).toBeFalse();
        });

        test('does not recognize CSV url with 404 response', async () => {
            expect(await File.canLoadFromOrganization({
                projects_list_url: 'http://www.mocky.io/v2/5e6eeb833300005f00f075e1/filename.csv'
            })).toBeFalse();
        });

        test('does not recognize JSON url with 404 response', async () => {
            expect(await File.canLoadFromOrganization({
                projects_list_url: 'http://www.mocky.io/v2/5e6eeb833300005f00f075e1/filename.json'
            })).toBeFalse();
        });
    });

    describe('snapshots JSON projects', () => {
        let projects;

        test('loads from Chi Hack Night organization', async () => {
            projects = await File.loadFromOrganization({
                projects_list_url: 'https://raw.github.com/open-city/civic-json-files/master/projects.json'
            });
            expect(projects).toBeInstanceOf(File);
            expect(projects).toBeInstanceOf(Projects);
        });

        test('has > 125 projects', () => {
            expect(projects).toBeInstanceOf(Map);
            expect(projects.size).toBeGreaterThan(120);
        });

        test('has foodborne', () => {
            expect(projects.has('foodborne')).toBeTrue();

            const foodborne = projects.get('foodborne');
            expect(foodborne).toBe('https://github.com/smartchicago/foodborne');

            const record = projects.buildRecord(foodborne);
            expect(record).toContainAllKeys([
                'name',
                'code_url'
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
