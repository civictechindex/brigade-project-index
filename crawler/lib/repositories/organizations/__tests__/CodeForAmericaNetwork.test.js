const tmp = require('tmp-promise');
const GitSheets = require('gitsheets');

const CodeForAmericaNetwork = require('../CodeForAmericaNetwork.js');

describe('Organizations: Code for America Network', () => {
    let organizations;

    test('loads from official url', async () => {
        organizations = await CodeForAmericaNetwork.loadFromUrl();
    });

    test('has > 200 brigades', () => {
        expect(organizations).toBeInstanceOf(Map);
        expect(organizations.size).toBeGreaterThan(200);
    });

    test('has Code for Philly', () => {
        expect(organizations.has('Code for Philly')).toBeTrue();

        const codeForPhilly = organizations.get('Code for Philly');
        expect(codeForPhilly).toBeObject();
        expect(codeForPhilly).toHaveProperty('website', 'https://codeforphilly.org');
        expect(codeForPhilly).toContainKeys([
            'name',
            'events_url',
            'rss',
            'latitude',
            'longitude',
            'projects_list_url'
        ]);
        expect(codeForPhilly.tags).toBeArray();
        expect(codeForPhilly.tags).toIncludeSameMembers([
            'Brigade',
            'Code for America',
            'Code for America Fiscally Sponsored Brigade',
            'Official'
        ]);
        expect(codeForPhilly.social_profiles).toBeObject();
        expect(codeForPhilly.social_profiles).toHaveProperty('twitter', '@codeforphilly');
    });

    test('writes to tree', async () => {
        const gitDir = await tmp.dir({ unsafeCleanup: true });
        const sheets = await GitSheets.create(gitDir.path);
        const { repo, git } = sheets;

        const expectedFilenames = [...organizations.keys()].map(name => `${name}.toml`);

        await git.init();
        const tree = await organizations.buildTree(repo);
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
