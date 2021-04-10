# brigade-project-index loader

This branch contains the tooling for automatically populating and updating the [`cfapi/orgs/v1`](https://github.com/codeforamerica/brigade-project-index/tree/cfapi/orgs/v1) and [`snapshot/v1`](https://github.com/codeforamerica/brigade-project-index/tree/snapshot/v1) branches.

## Running automatically

The loader gets run automatically every hour and on push to the `loader` or `master` branches via the GitHub Actions workflow defined in [`.github/workflows/crawler.yml`](https://github.com/codeforamerica/brigade-project-index/blob/master/.github/workflows/crawler.yml) on the `master` branch.

A history of runs can be accessed under the [Actions section of the brigade-project-index repository](https://github.com/codeforamerica/brigade-project-index/actions).

Automated runs make use of the [`brigade-bot`](https://github.com/brigade-bot) GitHub user to make commits, using a Personal Access Token issued under that account and [stored under the secret](https://github.com/codeforamerica/brigade-project-index/settings/secrets) `BOT_GITHUB_TOKEN` for authentication.

## Running locally

With node v12+ installed:

```bash
node run.js --all --commit-to=snapshot/v1 --commit-orgs-to=cfapi/orgs/v1
```

To avoid hitting GitHub's API rate limits easily, [generate a Personal Access Token](https://github.com/settings/tokens) and provide it via the environment:

```bash
export GITHUB_ACTOR="my-username"
export GITHUB_TOKEN="my-personal-access-token"
```

To see all available options:

```bash
node run.js --help
```

### Debugging with Visual Studio Code

This branch include configuration under [`.vscode/`](/.vscode/) for running the loader and debugging it interactively.

The "Import projects" launcher will prompt for your GitHub credentials, but won't remember them for you between runs. To make this less annoying:

- Use the restart button while debugging whenever you can, it will re-run the code with whatever changes you've saved without re-prompting for inputs
- Paste your settings into the blank defaults within [`.vscode/launch.json`](/.vscode/launch.json) and **don't commit them**
