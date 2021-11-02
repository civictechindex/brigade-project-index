# Overview

The Brigade Project Index is a collaborative effort involving core contributors from across many brigades.

We design, develop, and maintain a set of tools and practices for mapping out all the work being done on projects across the entire global network of civic hacking organizations and Code for America brigades.

Our core goal is to publish a rich and constantly-updated database of projects that any number of network projects can use as a data source to help us get better connected.

This tool collects data about civic tech projects crawling Github or other projects repositories (as provided by civic tech organizations)

- URL: [https://projects.brigade.network](https://projects.brigade.network/)
- Contacts: Chris at chris@codeforphilly.org
- Status: The current system is available and doesn’t have major known issues
- Project needs: The project is looking for ...
- How to collaborate: [Join Us](/docs/join-us.md#how-to-participate)
- Github: [https://github.com/codeforamerica/brigade-project-index](https://github.com/codeforamerica/brigade-project-index)

## More about the Index and the Statusboard

The index is the dataset we suck everything into.  The statusboard is a tool for browsing the index that's been designed around helping brigade's assess their index status (hence it doing things like showing checkmarks for key details being filled in).  The idea with the statusboard was for it to evolve into a one-stop-shop for brigade leaders and members to see how well their projects are indexed and where the gaps are.

The reason for this layered approach was that we wanted to focus on collecting really quality data that could be distributed across the network for a variety of tools and uses.  This way, there's a much stronger value prop for brigades to publish their projects into the index--it doesn't just feed one tool/site we're building, but a whole ecosystem of brigade network tools that anyone can add to. There are a couple other tools out there using the index in addition to the statusboard.

## Next enhancements

- Read the [public-code.yaml](../publiccode-helper.md)

## How to Get Involved

- Tag your projects on github!
  - Make sure your brigade's projects are listed in the index ([instructions](contributing/get-indexed.md))
  - Using the github "Topics", tag your project directly in github with #code-for-america and your brigade tag (e.g. code-for-sf). Then include any relevant topic tags from [this list](https://github.com/codeforamerica/civic-tech-taxonomy/tree/master/issues).

- [Join the discussion!](/docs/join-us.md#how-to-participate)

## Resources

- [`brigade-project-index` GitHub repository](https://github.com/codeforamerica/brigade-project-index)
  - [`snapshot/v1:/`](https://github.com/codeforamerica/brigade-project-index/tree/snapshot/v1): The crawler snapshot in raw data form, projected into a GitHub repo for distribution and historic tracking
  - [`index/v1:/`](https://github.com/codeforamerica/brigade-project-index/tree/index/v1): the first version of the published index
  - [`gh-pages:static-api/v1`](https://github.com/codeforamerica/brigade-project-index/tree/gh-pages/static-api/v1): Static JSON API projected into GitHub Pages website hourly
    - [`/static-api/v1/organizations.json`](https://brigade.cloud/static-api/v1/organizations.json): _all_ organizations
    - [`/static-api/v1/projects.json`](https://brigade.cloud/static-api/v1/projects.json): _all_ projects (large file)
    - [`/static-api/v1/organizations/Code for Philly/projects.json`](https://brigade.cloud/static-api/v1/organizations/Code%20for%20Philly/projects.json): all projects by brigade
    - [`/static-api/v1/organizations/Code for Philly/projects/laddr.json`](https://brigade.cloud/static-api/v1/organizations/Code%20for%20Philly/projects/laddr.json): details for one project
  - [`master:docs/`](https://github.com/codeforamerica/brigade-project-index/tree/master/docs): The source for this website
  - [`master:crawler/`](https://github.com/codeforamerica/brigade-project-index/tree/master/crawler): Script that crawls every brigade's projects list hourly
  - [`master:.github/workflows`](https://github.com/codeforamerica/brigade-project-index/blob/master/.github/workflows/crawler.yml): GitHub Actions Workflow that runs the crawler every hour
  - [Actions log](https://github.com/codeforamerica/brigade-project-index/actions): History of crawler runs
- [Network-wide GitHub topic search UI](https://hackforla.github.io/github-api-test/)
- [Network-wide index search UI](https://projects.brigade.network/)
- [`publiccode.yml` standard](https://docs.italia.it/italia/developers-italia/publiccodeyml-en/en/master/)
- [GitHub Community Health Files standards](https://help.github.com/en/articles/creating-a-default-community-health-file-for-your-organization)
