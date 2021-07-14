# Public Code

public-code is a worldwide idea for a standard way to describe projects involving government entities.
Its core is to use a standard minimum but flexible and extensible schema of a piece of documentation that can be automatically discovered and processed.

- URL: The main original repository is [https://github.com/italia/publiccode.yml](https://github.com/italia/publiccode.yml)
- Contact: Bonnie at bonnie@hackforla.org or Gio at giosce@verizon.net
- Status: We forked a Code For America version at [https://codeforamerica.github.io/publiccode-pusher](https://codeforamerica.github.io/publiccode-pusher) 
- Project needs: Taxonomy Expert, Github deployment settings, Front-End Developer
- How to collaborate:  [Join Us](../join-us.md#how-to-participate)
- Github: [https://github.com/codeforamerica/publiccode-pusher](https://github.com/codeforamerica/publiccode-pusher) 
  
We are discussing whether and how to extend the schema to better describe Code For America typical projects. Right now the schema (documentation) seems maintained by the "Agency for Digital Italy" at  [https://docs.italia.it/italia/developers-italia/publiccodeyml-en/en/master/](https://docs.italia.it/italia/developers-italia/publiccodeyml-en/en/master/).

We are looking to provide a UI to guide people in creating their repo meaningful public-code.yaml. 
Note that many civic-tech index tools are already set to read the public-code.yaml (the brigade-project-index crawler does that [Chris?])

Compare to the Italian version [https://publiccode-editor.developers.italia.it/](https://publiccode-editor.developers.italia.it/), we want to do the following changes:

- Review and possibly change what's mandatory and what's not
- Add fields like technologies, skills, organization, location
- Add some "behind the scene" tags like code-for-america and/or civic-tech-index
- Change the list of values (especially for Category and Issue)

A description of the schema including what items are mandatory and explanation of each item can be found [here](https://github.com/codeforamerica/publiccode-pusher/blob/master/schema/schema.core.rst)

Basically, the PublicCode Editor should use all the values in the Code For America projects [Taxonomy](../civic-tech-taxonomy). In fact, eventually the PublicCode Editor should retrieve the values of several dropdowns via a Taxonomy API.

The tool asks the user to log in a repository and when the user saves the new public-code.yml the tool creates a branch and a pull request in the designated repository.

From this step, authorized users of the repository can review, modify if needed and merge the public-code.yml in their main branch.

It needs to be in the repository top folder.

Later on, the public-code.yml could be edited again via this user interface but as of now the source schema needs to be uploaded from local disk (it would be more convenient the possibility to edit the github version directly).

While the tools is set to work with github, it would be convenient if it works also against other repository.
