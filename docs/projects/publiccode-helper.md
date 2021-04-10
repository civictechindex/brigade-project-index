# Public Code

public-code is a worldwide idea for a standard way to describe projects involving government entities.
Its core is to use a standard minimum but flexible and extensible schema of a piece of documentation that can be automatically discovered and processed.

- URL: The main original repository is [https://github.com/italia/publiccode.yml](https://github.com/italia/publiccode.yml)
- Contact: Bonnie at bonnie@hackforla.org or Gio at giosce@verizon.net
- Status: There is a usable version at [https://giosce.github.io/publiccode-pusher](https://giosce.github.io/publiccode-pusher) 
- Project needs: Taxonomy Expert, Front-End Developer
- How to collaborate:  [Join Us](../join-us.md#how-to-participate)
- Github: [https://giosce.github.io/publiccode-pusher](https://giosce.github.io/publiccode-pusher) 
[https://github.com/civictechindex/publiccode-pusher](https://github.com/civictechindex/publiccode-pusher)
  
We are not thinking to change the existing schema (as found in github official repository).

We are looking to provide a UI to guide people in creating their repo meaningful public-code.yaml. 
Note that many civic-tech index tools are already set to read the public-code.yaml (the brigade-project-index crawler does that [Chris?])

Compare to the prototype [https://giosce.github.io/publiccode-pusher](https://giosce.github.io/publiccode-pusher), we want to do the following changes:

- Review and possibly change what's mandatory and what's not
- Add mandatory tags (like code-for-america and/or civic-tech-index and others)
- Make Category and Issue mandatory
- Change the list of values (especially for Category and Issue)
- Allow to enter new Category and Issue

A description of the schema including what items are mandatory and explanation of each item can be found [here](https://github.com/giosce/publiccode-pusher/blob/master/schema/schema.core.rst)

The tool asks the user to log in a repository and when the user saves the new public-code.yml the tool creates a branch in the designated repository.

From this step, authorized users of the repository can review, modify if needed and merge the public-code.yml in their main branch.

It needs to be in the repository top folder.

Later on, the public-code.yml could be edited again via this user interface but as of now the source schema needs to be uploaded from local disk (it would be more convenient the possibility to edit the github version directly).

While the tools is set to work with github, it would be convenient if it works also against other repository.
