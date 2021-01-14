# Project Profiles

The index strives to collect as much information as possible about projects from wherever they're already sharing it.

To that end, data gets captured from multiple sources, and then project profiles are compiled based on the best available data. This means that the index imposes some opinions on which data is the best data.

## Data precedence

Data from higher up in this list takes precedence over data from lower down:

- organizational projects feed
- `publiccode.yml` content
- GitHub repository metadata
- `README.md` content

## Data sources

### Organizational projects feed

If an organization publishes their own projects feed via a hosted CSV or JSON file (rather than using a GitHub organization or topic tag), that project feed can include project metadata:

- `name`
- `title`
- `description`
- `link_url`
- `code_url`
- `tags` / `topics`
- `status`
- `chat_channel`

### `publiccode.yml` content

When a `code_url` is declared and can be connected to via the GitHub API or git protocols, any `publiccode.yml` file present in the root of the repository will be parsed for project data.

[`publiccode.yml` is a metadata standard](https://docs.italia.it/italia/developers-italia/publiccodeyml-en/en/master/index.html) for public software projects.

!!! todo "TODO"

    Help implement this!


### GitHub repository metadata

GitHub repository metadata can include a name, description, homepage URL, and list of topic tags.

### `README.md` content

When a `code_url` is declared and can be connected to via the GitHub API or git protocols, any `README.md` file present in the root of the repository will be parsed for project data.

The first paragraph will be captured as a description, and all second-level headings as available sections

!!! todo "TODO"

    Help implement this!
