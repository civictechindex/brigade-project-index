# Civic Tech Taxonomy

This project aims at a categorization of civic tech projects. There have been numerous attempts at this important goals, various websites that provide lists of civic tech projects have implemented their own classification.
A comprehensive and intuitive projects categorization is critical in order to avoid duplication of efforts, improve volunteer recruiting and retention, optimize resources, seek for repeatable processes, reach the market and more.

- Github: [https://codeforamerica.github.io/civic-tech-taxonomy/](https://codeforamerica.github.io/civic-tech-taxonomy/)
- Contacts: Gio at giosce@verizon.net 
- Status: Conceptual
- Project needs: Civic Tech and Classification/Taxonomy competency, front-end developers
- How to collaborate: [Join Us](../join-us.md#how-to-participate)
- Draft UI: [https://codeforamerica.github.io/civic-tech-taxonomy/editor-ui/](https://codeforamerica.github.io/civic-tech-taxonomy/editor-ui/)https://codeforamerica.github.io/civic-tech-taxonomy/editor-ui/
- Draft API Swagger https://codeforamerica.github.io/civic-tech-taxonomy/editor-ui/swagger.html

There are some significant challenges to achieve such a good taxonomy

- Open source civic tech projects spring up often without strong organization
- How projects are defined / tagged
- Abstract classification of the issues to tackle, the beneficiary of the project and more
- There are mainly 2 approaches on leveraging projects tags
  - Projects are manually input in a database with specific tags
  - Crawlers or queries retrieve all tags of all projects of interest
- In the first case, the list of projects is limited and projects details risk to be outdated. In the second case, the tags can’t easily fit in a define taxonomy, there are many variations of the same keyword, there are tags that refer to realms (like technologies or locations).

As of now, the Taxonomy has been built as bottom-up, this taxonomy categorizes (via synonims) the majority of "topics" extracted by the [Crawler](crawler/README.md) from all the scanned projects.
Ideally there may need both a bottom-up and a top-down taxonomies that hopefully will converge.

There are github action and python scripts that load the taxonomy data (toml files) in a [relational database](https://codeforamerica.github.io/nac-sandbox-cluster/civic-tech-taxonomy/mysql/) which allows for more data analysis

## Next Enhancements

We are discussing some enhancements focused on the Taxonomy

- Review and validate the current set of items
- Decided if bottom-up is the right approach
- Decide how to keep this list up to date (integrate the taxonomy with the [crawler](crawler/README.md)
- Decided whether to separate items that are not "topics" from the large list extracted by the crawler
- Provide a proper UI to the taxonomy
- Integrate the taxonomy in the [Statusboard](../statusboard.md) and [PublicCode Editor](../publiccode-helper)
