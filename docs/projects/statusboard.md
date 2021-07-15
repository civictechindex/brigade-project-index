# Statusboard

This tool allows to search Code for America USA projects by brigade or topics tags.
This graphical interface loads the brigade projects data via the API at https://statusboard.brigade.cloud/api/data.json which returns a subset of the data produced by the
Index Crawler. Compare with the [Index Crawler data](https://brigade.cloud/projects/crawler/#more-about-the-index-and-the-statusboard) the statusboard API retrieves only the organizations tagged as "brigade" or "code for america".

The Statusboard graphical interface display the US Brigades in a map and allows to search the projects based on their topic tag
s.

Note that these are the tags as they are collected by the Index Crawler
and thus they include tags referring to locations and technologies employed.

- URL: [https://projects.brigade.network/](https://projects.brigade.network/)
- Contacts: Melanie Mazanec
- Status: The current system is available and doesn’t have major known issues
- Project needs: The project is looking for ReactJS developers
- How to collaborate: [Join Us](../join-us.md#how-to-participate)
- Github: [https://github.com/codeforamerica/brigade-project-index-statusboard](https://github.com/codeforamerica/brigade-project-index-statusboard)

## More about the Index and the Statusboard

The index is the dataset we suck everything into.  The statusboard is a tool for browsing the index that's been designed around helping brigade's assess their index status (hence it doing things like showing checkmarks for key details being filled in).  The idea with the statusboard was for it to evolve into a one-stop-shop for brigade leaders and members to see how well their projects are indexed and where the gaps are.

The reason for this layered approach was that we wanted to focus on collecting really quality data that could be distributed across the network for a variety of tools and uses.  This way, there's a much stronger value prop for brigades to publish their projects into the index--it doesn't just feed one tool/site we're building, but a whole ecosystem of brigade network tools that anyone can add to. There are a couple other tools out there using the index in addition to the statusboard.

## Next enhancements

This user interface will include the [Civic Tech Taxonomy](civic-tech-taxonomy.md) to guide the users in their project search.
