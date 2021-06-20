USE `cfa_project_index`;

DROP TABLE IF EXISTS `organizations_locations`;
DROP TABLE IF EXISTS  `organizations_tags`;
DROP TABLE IF EXISTS  `locations`;

DROP TABLE IF EXISTS  `organizations`;
DROP TABLE IF EXISTS  `tags`;

DROP TABLE IF EXISTS  `projects_topics`;
DROP TABLE IF EXISTS  `projects`;
DROP TABLE IF EXISTS  `topics`;

DROP TABLE IF EXISTS  `periods`;
DROP TABLE IF EXISTS  `states_regions`;

DROP VIEW IF EXISTS  `brigades_topics`;
DROP VIEW IF EXISTS  `projects_last_pushed_within`;
DROP VIEW IF EXISTS  `organizations_last_pushed_within`;
DROP VIEW IF EXISTS  `organizations_projects_count`;
DROP VIEW IF EXISTS  `projects_organizations_locations`;