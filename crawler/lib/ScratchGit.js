const logger = require('winston');
const tmp = require('tmp-promise');
const gitUp = require('git-up');
const exitHook = require('async-exit-hook');
const { Repo } = require('hologit/lib');
const { default: PQueue } = require('p-queue');

let cachedRepo = null;
let cachedGit  = null;
const cachedFetchResults = new Map();
const fetchQueue = new PQueue({ concurrency: 1 });
const { GITHUB_ACTOR, GITHUB_TOKEN } = process.env;

module.exports = class ScratchGit {

    /**
     * Set the path of a persistent git directory to use as scratch space
     * for all future operations
     * @param {string} gitDir
     */
    static async setPersistentGitDir (gitDir) {
        // initialize hologit Repo instance
        cachedRepo = new Repo({
            gitDir: gitDir,
            ref: 'HEAD'
        });
        cachedGit = await cachedRepo.getGit();

        logger.info(`initializing persistent GIT_DIR=${gitDir}`);
        await cachedGit.init({ bare: true });
    }

    static async getRepo () {
        if (!cachedRepo) {
            // create temporary git directory
            const gitDir = await tmp.dir({ unsafeCleanup: true });
            exitHook(callback => gitDir.cleanup().then(callback));

            // initialize hologit Repo instance
            cachedRepo = new Repo({
                gitDir: gitDir.path,
                ref: 'HEAD'
            });
            cachedGit = await cachedRepo.getGit();

            logger.info(`initializing temporary GIT_DIR=${gitDir.path}`);
            await cachedGit.init({ bare: true });
        }

        return cachedRepo;
    }

    static async getGit () {
        if (!cachedGit) {
            // will set cachedGit
            await this.getRepo();
        }

        return cachedGit;
    }

    /**
     * Fetch the current commit hash for given url/ref
     * @param {string} url
     * @param {string=HEAD} ref
     */
    static async fetchRemote (url, ref = 'HEAD') {
        return fetchQueue.add(async () => {
            const { resource, pathname } = gitUp(url);
            const remoteKey = `${resource}${pathname.replace(/\.git$/i, '')}/${ref}`;

            if (cachedFetchResults.has(remoteKey)) {
                return cachedFetchResults.get(remoteKey);
            }

            let fetchUrl;
            if (resource == 'github.com') {
                fetchUrl = `https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com${pathname}.git`;
            } else {
                fetchUrl = url;
            }

            const cacheRef = `refs/crawler-cache/${remoteKey}`;
            const git = await this.getGit();

            logger.debug(`fetching ${url}#${ref}`);
            try {
                const fetchResult = await git.fetch({ depth: 1, tags: false }, fetchUrl, `+${ref}:${cacheRef}`);
                logger.silly(`fetched ${url}#${ref}: ${fetchResult}`);
                return git.revParse({ verify: true }, cacheRef, { $nullOnError: true });
            } catch (err) {
                logger.debug(`could not fetch ${url}#${ref}: ${err}`);
            }
        });
    }
};
