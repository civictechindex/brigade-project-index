This folder contains scripts to create and populate a mysql database with the toml files created by the brigade-project-index crawler process https://github.com/codeforamerica/brigade-project-index.
The Action (.github/workflows) is scheduled to run every day at midnight. This workflow, the sql and python scripts use 4 environmental variables:
- DB_HOST
- DB_USER
- DB_PWD' // password
- DB_DB // database

This Action shares the database with a similar workflow in the civic-tech-taxonomy project (https://github.com/codeforamerica/civic-tech-taxonomy), the scripts here handle a portion of the database schema and data. The full database contains index and taxonomy data.

The Action creates a virtual environment as well as a kubernete connection with a CfA MySQL database server https://codeforamerica.github.io/nac-sandbox-cluster/civic-tech-taxonomy/mysql/

It then run the following scripts:
- tools/mysql-loader/drop-schema.sql to drop the tables and views
- tools/mysql-loader/create-schema.sql to create the tables and views
- org-toml-2-mysql.py downloads the https://github.com/codeforamerica/brigade-project-index/archive/index/v1.zip data produced by the crawler.
It extracts the organizations (brigades) data in /tmp folder and populate some database tables.
- proj-toml-2-mysql.py downloads the https://github.com/codeforamerica/brigade-project-index/archive/index/v1.zip data produced by the crawler.
It extracts the projects (again in /tmp folder, so it should be possible to skip this step if previously downloaded data) 
information and populate some database tables.

The portion of the database used by the project-index comprises the following tables and views

![image](https://user-images.githubusercontent.com/16311029/122990239-bb2d3780-d371-11eb-9267-a2089f5865ab.png)

- ToDo/Improve
  - When extracting the toml data files in /tmp, first we should delete the previous extract otherwise older files will be processed again.
