# Crawler

The Crawler is built with Node.js and development is primarily supported for [Visual Studio Code](https://code.visualstudio.com/).

## After Cloning or Pulling

Make sure you're using node 14:

```bash
node --version
```

On Mac with node installed via Homebrew, you can switch your current shell to node 14:

```bash
brew install node@14
export PATH="/usr/local/opt/node@14/bin:$PATH"
```

Install node modules:

```bash
cd crawler
npm install
```

## Setting up Editor

Install all recommended extensions when prompted to by Visual Studio Code after opening the workspace. These are configured in `.vscode/extensions.json` and include:

- **ESLint**: Provides live feedback about style rules and potential code issues while editing JavaScript sources
- **markdownlint**: Provides live feedback about style rules and potential code issues while editing Markdown sources
- **Node Debug**: Provides for live debugging of Node.js scripts

## Debugging

A `test-organizations.json` file at `crawler/lib/repositories/organizations/__fixtures__/test-organizations.json` is available with a minimal set of organizations for testing.

### Debugging Within Visual Studio Code

The `Crawl *` launch configurations can be used to run partial or full crawls with interactive debugging available. Any breakpoints set within `run.js` or any classes will pause.

These are configured to use the abbreviated `test-organizations.json` file described again, comment out the argument to run a full crawl.

## Debugging on the Command Line

You can run the crawler from the command line with interactive debugging enabled for attachment over TCP:

```bash
# export GITHUB_ACTOR and GITHUB_TOKEN if you git rate limits

node --inspect-brk \
    crawler/run.js \
    --all \
    --commit-to='snapshot/v1' \
    --commit-orgs-to='cfapi/orgs/v1' \
    --orgs-source='crawler/lib/repositories/organizations/__fixtures__/test-organizations.json'
```

## Running Tests

### Testing Within Visual Studio Code

With the `Crawler: Jest Current File` debug configuration selected, you can press F5 or otherwise run the *Start Debugging* command to execute the `*.test.js` file you have open. In most cases, you can do this with a source file open too and Jest will find the associated tests. Breakpoints in both test files and sources should work when running tests this way.

Use the `Crawler: Jest All` debug configuration to run all available tests.

### Testing on the Command Line

```bash
cd crawler
npm run test
```

## Architecture

### `crawler/run.js`

The main entrypoint for running The Crawler's command. [Yargs](http://yargs.js.org/) is used to parse arguments and implement the command. Run `node run.js --help` to see all available options.

### `crawler/lib/repositories/**`

Repository classes provide for interaction with specific populations of records.

### `crawler/lib/parsers/**`

Parser classes help read records from raw data.

### `crawler/package.json`

Tracks runtime and development node module dependencies for The Crawler

### `crawler/**/__tests__/*.test.js`

[Jest](https://jestjs.io/) tests, (mostly) aligned with the source files they cover.

### `crawler/jest.config.js`

Global configuration for Jest.

### `crawler/jest.setup.js`

Script configured to run before every test suite.

### `crawler/.eslint.json`

[ESLint](https://eslint.org/) configuration that should work with Visual Studio Code's ESLint extension
