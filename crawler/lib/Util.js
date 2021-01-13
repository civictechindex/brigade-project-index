module.exports = class Util {

    /**
     * Return clone of object with only populated keys preserved
     * @param {object} data The source object to read data from
     * @param {string[]=} keys Optional whitelist of keys to copy
     */
    static cleanData (data, keys = null) {
        if (keys === null) {
            keys = Object.keys(data);
        }

        const output = {};

        for (const key of keys) {
            const value = data[key];

            if (value === '' || value === null || value === undefined) {
                continue;
            } else if (Array.isArray(value) && !value.length) {
                continue;
            }

            output[key] = value;
        }

        return output;
    }
};
