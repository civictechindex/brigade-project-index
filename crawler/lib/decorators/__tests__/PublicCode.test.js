const PublicCode = require('../PublicCode.js');


describe('Project Decorator: PublicCode', () => {

    test('populates publiccode', async () => {
        const projectData = {
            code_url: 'https://github.com/italia/18app'
        };

        expect(await PublicCode.canDecorate(projectData)).toBeTrue();

        await PublicCode.decorate(projectData);

        expect(projectData['publiccode.yml']).toBeObject();
        expect(projectData['publiccode.yml']).toHaveProperty('url', 'https://github.com/italia/18app');
        expect(projectData['publiccode.yml']).toContainKeys([
            'categories',
            'description',
            'developmentStatus',
            'intendedAudience',
            'it',
            'legal',
            'localisation',
            'logo',
            'maintenance',
            'name',
            'platforms',
            'publiccodeYmlVersion',
            'releaseDate',
            'softwareType',
            'url',
        ]);
        expect(projectData['publiccode.yml'].categories).toBeArray();
        expect(projectData['publiccode.yml'].categories).toEqual(['mobile-payment']);

    });

});
