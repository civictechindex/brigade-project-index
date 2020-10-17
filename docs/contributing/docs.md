# Documentation / Website

This documentation website is generated with **MkDocs**. See [the MkDocs documentation](https://www.mkdocs.org/) for detailed information on writing and styling documentation.

## File layout

```shell
mkdocs.yml          # the configuration file
docs/
    README.md       # the documentation homepage
    ...             # other markdown pages, images and other files
```

## Live previews

With [Docker installed](https://docs.docker.com/get-docker/) and [Chef Habitat installed](https://www.habitat.sh/docs/install-habitat/), you can work against a live-updating local version of the site in one command:

```bash
script/studio
```

## Publishing documentation

Changes pushed/merged into the `master` branch will be automatically deployed via GitHub Actions within a couple minutes.

## Added features

Several additional features/extensions are enabled in the documentation site:

- [Mermaid](https://mermaid-js.github.io/mermaid/#/) code fences
- [Awesome Pages Plugin](https://github.com/lukasgeiter/mkdocs-awesome-pages-plugin)
- [Material theme](https://squidfunk.github.io/mkdocs-material/)
  - [Admonitions](https://squidfunk.github.io/mkdocs-material/extensions/admonition/)
  - [CodeHilite](https://squidfunk.github.io/mkdocs-material/extensions/codehilite/)
  - [Metadata](https://squidfunk.github.io/mkdocs-material/extensions/metadata/)
  - [Permalinks](https://squidfunk.github.io/mkdocs-material/extensions/permalinks/)
  - [PyMdown Markdown Extensions](https://squidfunk.github.io/mkdocs-material/extensions/pymdown/)
    - [InlineHilite](https://squidfunk.github.io/mkdocs-material/extensions/pymdown/#inlinehilite)
    - [Tasklist](https://squidfunk.github.io/mkdocs-material/extensions/pymdown/#tasklist)
    - [SmartSymbols](https://squidfunk.github.io/mkdocs-material/extensions/pymdown/#smartsymbols)
    - [SuperFences](https://squidfunk.github.io/mkdocs-material/extensions/pymdown/#superfences)
