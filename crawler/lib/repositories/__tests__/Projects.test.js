const Projects = require('../Projects.js');


describe('Projects', () => {
    test('sorts topics', () => {
        expect(Projects.prototype.buildRecord({ topics: [
            'c',
            'b',
            'a'
        ]}).topics).toEqual([
            'a',
            'b',
            'c'
        ]);
    });

    test('sorts topics case insensitively', () => {
        expect(Projects.prototype.buildRecord({ topics: [
            'C',
            'b',
            'A'
        ]}).topics).toEqual([
            'A',
            'b',
            'C'
        ]);
    });

    test('sorts topics ignoring punctuation', () => {
        expect(Projects.prototype.buildRecord({ topics: [
            'a-c',
            'ab',
            'A-A',
        ]}).topics).toEqual([
            'A-A',
            'ab',
            'a-c'
        ]);
    });

    test('sorts numerically', () => {
        expect(Projects.prototype.buildRecord({ topics: [
            'A10',
            'a1',
            'A2',
        ]}).topics).toEqual([
            'a1',
            'A2',
            'A10'
        ]);
    });
});
