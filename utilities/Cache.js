const { THREE_MINUTES } = require("./utils");

class OutputCache {
    constructor() {
        /**
         * @type {Map<string, number>}
         */
        this.pathToTime = new Map();
        /**
         * @type {Map<string, string>}
         */
        this.pathToOutput = new Map();
    }

    /**
     * @param {string} str 
     */
    check(str) {
        const lastTime = this.pathToTime.get(str);

        if (!lastTime || Date.now() - lastTime > THREE_MINUTES) {
            return null;
        }

        return this.pathToOutput.get(str) || null;
    }

    /**
     * @param {string} str 
     * @param {string} output 
     */
    update(str, output) {
        this.pathToOutput.set(str, output);
        this.pathToTime.set(str, Date.now());
    }
}

module.exports = OutputCache;
