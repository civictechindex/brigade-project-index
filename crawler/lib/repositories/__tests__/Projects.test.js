const Projects = require('../Projects.js');


describe('Projects', () => {
    test('sorts topics', () => {
        expect(Projects.normalizeRecord({ topics: [
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
        expect(Projects.normalizeRecord({ topics: [
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
        expect(Projects.normalizeRecord({ topics: [
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
        expect(Projects.normalizeRecord({ topics: [
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
