# Get your organization indexed

The [Project Index Statusboard](../../statusboard.md) aggregates all Code for America brigade projects and displays them on a map. Adding your brigade’s projects to the Statusboard can be done through one of several automated (or semi-automated) processes.


## Verify that your brigade is listed accurately

The index automatically pulls data from the [brigade-information project](https://github.com/codeforamerica/brigade-information):



1.  View the [organizations.json file](https://github.com/codeforamerica/brigade-information/blob/master/organizations.json) and look for your brigade (a simple cmd-F should do the trick).
2. If your brigade is already listed, check the following fields:
    1. **“projects_list_url”** should be your brigade’s GitHub URL.
    2. **“tags”** should include "Brigade" and "Code for America".
3. If your brigade is _not_ listed there or you want to consider other ways to include your brigade’s projects, choose one of the methods below.

Note that currently, non-US and non-brigade organizations aren’t currently pulled into the Project Index Statusboard.


## Ways to index your brigade’s projects


### Method 1: Using your brigade’s GitHub URL

Do your brigade’s projects live under your GitHub organization?  You can just use the URL for that (i.e. “https://github.com/codefornola”) as the key for “projects_list_url” in the [organizations.json file](https://github.com/codeforamerica/brigade-information/blob/master/organizations.json).

If you have projects that live outside of GitHub, you’ll have to create a “placeholder” repo for each of those projects. These repos need only include a readme.md doc with relevant links to external project documentation as appropriate.


### Method 2) Using GitHub topics

In this option, all brigade project repos should include a shared topic based on the brigade's name (eg _openoakland_ or _hack-for-la_). See [GitHub’s instructions for adding a topic to a repo](https://help.github.com/en/github/administering-a-repository/classifying-your-repository-with-topics).


### Method 3) Using Google Sheets

Create a sheet with the same headers as [this example](https://docs.google.com/spreadsheets/d/1JWzgYPn1AZgw1UFbh0n6xzpS1a9wvDN2xsrJ-IyrcQ4/edit#gid=0) (or just copy the example with File > Make a copy).  Then select File > Publish to the web.  Use the sheets popup to select just your sheet (not the whole document) and a CSV format.  Use the link to this CSV as the value for the “`projects_list_url`” key in the [organizations.json file](https://github.com/codeforamerica/brigade-information/blob/master/organizations.json).  The link, once you have obtained it, should end in “/pub?gid=0&single=true&output=csv”.

Tags should be comma separated in a single column.


### Method 4) Using a CSV or json file

Google Sheets is a common tool so we’ve written out instructions, but any JSON or CSV file _with the right column headers_ and the correct link in the [organizations.json file](https://github.com/codeforamerica/brigade-information/blob/master/organizations.json) (see the Google Sheet instructions above) will do the trick.

If you have questions or are interested in helping to improve the Brigade Project Index, please [read the README on the repo](https://github.com/codeforamerica/brigade-project-index) and visit #brigade-project-index in the CfA slack.


## Tagging your brigade’s projects

The group that has been working on this project has begun to form a [taxonomy](../../civic-tech-taxonomy.md).  When assigning topics, please check [the existing topics](https://statusboard.brigade.cloud/api/taxonomy.json) (and consider adding to [the official set](https://github.com/codeforamerica/civic-tech-taxonomy/tree/master/issues) if something is missing) first to be sure you’re not creating a duplicate.  **For COVID-19 related projects, please use the topic “covid-19”.**

## More about the Index and the Statusboard

The index is the dataset we suck everything into.  The statusboard is a tool for browsing the index that's been designed around helping brigade's assess their index status (hence it doing things like showing checkmarks for key details being filled in).  The idea with the statusboard was for it to evolve into a one-stop-shop for brigade leaders and members to see how well their projects are indexed and where the gaps are.

The reason for this layered approach was that we wanted to focus on collecting really quality data that could be distributed across the network for a variety of tools and uses.  This way, there's a much stronger value prop for brigades to publish their projects into the index--it doesn't just feed one tool/site we're building, but a whole ecosystem of brigade network tools that anyone can add to. There are a couple other tools out there using the index in addition to the statusboard.
