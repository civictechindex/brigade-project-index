# Objective

Make Civic projects discoverable. 

For research, for volunteering, for collaboration, find and contribute civic projects to a nationwide network of volunteers.

## History

Begun in August 2019 by 8 brigades in the Code for America network, Project Index has reached out to other members of the civic community, including Democracy Lab.

## Including Your Brigade/Organization in the Index

The index is populated by an automated crawler that starts from the [`brigade-information` project](https://github.com/codeforamerica/brigade-information)'s [`organizations.json` data file](https://github.com/codeforamerica/brigade-information/blob/master/organizations.json). To add or update your civic tech organization's listing in the index, open a pull request against the `brigade-information` project according to its [*How to add or edit your Brigade for the API*](https://github.com/codeforamerica/brigade-information#how-to-add-or-edit-your-brigade-for-the-api) instructions.

## Who We Are

* Alison Lawyer, OpenOakland, alison@openoakland.org, @alison
* Bonnie Wolfe, Hack for LA,, bonnie@hackforla.org, @Bonnie Wolfe
* Colin King-Bailey, Open Oakland, ckingbailey@gmail.com, @ckingbailey
* Greg Boyer, Code for SF, greg@codeforsanfancisco.org, @Gregory Boyer
* Nikolaj Baer, Open San Diego, nikolaj.baer@gmail.com, @Nikolaj Baer
* Tom Dooner, Open Oakland, CfA, tdooner@codeforamerica.org, @tdooner
* Chris Alfano, Code for Philly, chris@codeforphilly.org, `@chris (former NAC)`

## How We Work

## Getting Involved

1. Review the Google Drive for meeting agendas and notes: 
https://drive.google.com/drive/u/1/folders/1yaJe0QQSEw_fKljTJ719o9hQlJAKwGr5

2. Join the Slack that we use as primary means of communication: 
https://cfa.slack.com #brigade-project-index

3. Review Github where we track pieces of work and have specific discussions: 
https://github.com/codeforamerica/brigade-project-index/projects/1

4. Get invited to the meeting! Every 2 weeks, Sunday at 6pm. After reviewing the onboarding document, drop a request in the slack channel to be included. 

5. For more context, feel free to read through the discourse topic that outlines much of the historical work done around this project:
(https://discourse.codeforamerica.org/t/brigade-network-project-indexing/533)

6. Read the project brief for an understanding of the current product and it's roadmap: https://docs.google.com/document/d/164Osa-ArdlJppQXqhKmAGjyqaCvkVZ8ZkMg4a3Wkmlk/edit?folder=1yaJe0QQSEw_fKljTJ719o9hQlJAKwGr5#

## MVP

The current mvp, based on the stories on github (https://github.com/codeforamerica/brigade-project-index/projects/2) is based around leveraging github, a central tool for most projects in the brigade network. The MVP includes the following pieces:

* Education on github best practices, tagging, descriptions. User research will be needed to determine how native github metadata can be a source of the project info, but the team agrees that high github literacy is fundamental to a successful implementation
* A taxonomy for skills and interests to allow for standardized grouping and searching of projects.
* A methodology (e.g. working group?) for maintaining taxonomies.
* A defined set of metadata describing projects, potentially defined as a json file.
* An interface that consolidates projects into a searchable list

## Project Description

### Technologies Used

* Github
* [publicode.yml](https://github.com/italia/publiccode.yml)

### Guiding Principles

* Have an open and accessible process with outreach, documentation, public discussions and transparent decisions
* Enable grassroots-driven projects across the brigade network with the minimum number of barriers (technical and otherwise) to inclusion in the index
