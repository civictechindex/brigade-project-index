const Organization = require('../Organization.js');

describe('Organization Parser', () => {
    test('load projects from GitHub organization', async () => {
        const result = await Organization.loadProjects({
            projects_list_url: 'https://github.com/codeforabq'
        });
        debugger;
    });
});
