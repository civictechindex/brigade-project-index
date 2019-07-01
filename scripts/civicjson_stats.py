'''
Analysis of Code For America Civic.json usage

Questions:
1. What % of projects / brigades are using Civic.json?
2. How many are using the Code for DC Extended version?
3. What is the spread of status vs age of last commit ( e.g. how many are "Archived" vs just out of date)
4. How many have a working production url / project URL?
5. How many are using tags? What are the most common tags?
6. Bonus: can we identify forks? Is there a visible level of duplication?

'''

import requests
import requests_cache
from urllib.parse import urljoin,urlparse
import json
import os,os.path,sys,datetime
from jsonschema import Draft4Validator


CFAPI = "https://api.codeforamerica.org/api/"
GITHUB_AUTH = (os.environ.get("GITHUB_TOKEN",""),'')

GITHUB_CONTENT_API_URL = 'https://api.github.com/repos{repo_path}/contents/{file_path}'

class RateLimitException(Exception): pass

def github_api(url,headers=None):
    resp = requests.get(url, auth=GITHUB_AUTH, headers=headers)
    if resp.status_code == 403:
        reset_time = resp.headers.get("X-RateLimit-Reset",None)
        if reset_time != None:
            print("Reset on %s" % datetime.datetime.fromtimestamp(int(reset_time)))
        raise RateLimitException(resp.text)
    return resp
    
def fetchall(url,cache=None):
    print("Fetching %s"%url)
    n = url 
    result = []
    while n != None:
        resp = requests.get(n)
        print(".")
        o = resp.json()
        result += o["objects"]
        n = o["pages"].get("next",None)

    return result
        
def get_brigades(cache=True):
    brigades = fetchall(urljoin(CFAPI,"organizations","?type=Brigade, Code for America, Official"),cache="_brigades")

    print("Fetched %i organizations" % len(brigades))
    return brigades

def get_project_civicjson(code_url):
    github_path = urlparse(code_url).path.rstrip('.git')
    civic_url = GITHUB_CONTENT_API_URL.format(repo_path=github_path, file_path='civic.json')
    request_headers = {'Accept': 'application/vnd.github.v3.raw'}
    response = github_api(civic_url, headers=request_headers)
    if response.status_code == 200:
        try:
            return response.json()
        except json.decoder.JSONDecodeError as e:
            raise ValueError("JSON Decode Error: %s" % str(e))
    else:
        print(code_url,response.status_code)
    return None
   

if __name__ == "__main__":
    if os.environ.get("GITHUB_TOKEN"):
        print("Using Github Token")
    else:
        print("You need a Github Token (or else this will rate-limit fairly quickly)")
        sys.exit(1)

    # Install requests cache
    # Cache 404s from Github API requests for civic.json
    requests_cache.install_cache(allowable_codes=(200,404))

    brigades = get_brigades()
    csv_brigades = dict([ (b["name"],b) for b in brigades if not b["projects_list_url"] or "github" not in b["projects_list_url"]])

    # Load Projects (from cache if exists)
    # and brigade projects
    projects = [] 
    for br in brigades:
        print("getting projects for %s" % br["name"])
        b_projects = fetchall( br["all_projects"] )
        print("... %i projects retrieved" % len(b_projects) )
        projects += b_projects 
    
    print("loaded %i projects" % len(projects))

    # Go through projects and check for Civic.json
    github_hosted = [ 
        p for p in projects 
        if p.get("code_url") 
            and "github" in p.get("code_url","") 
    ]
    print("%i of %i code-hosting on github" % \
            (len(github_hosted),len(projects)))
  
    civicjson_schema = requests.get(
        'https://raw.githubusercontent.com/DCgov/civic.json/master/schema.json'
    ).json()
    v = Draft4Validator(civicjson_schema)

    # Assumes we need github for civic.json (as does the cfapi)
    # Check for Civicjson and validate

    annotated_projects = []
    for gh in github_hosted:
        try:
            civicjson = get_project_civicjson(gh["code_url"])
            if civicjson:
                valid = v.is_valid(civicjson)
                print(gh["name"], valid and "VALID" or "NOT-VALID")
                gh["civicjson"] = civicjson
                gh["civicjson_is_valid"] = valid
                if gh["organization"]["name"] in csv_brigades:
                    plu = csv_brigades[gh["organization"]["name"]]["projects_list_url"]
                    if "csv" in plu.lower():
                        gh["csv_project_list"] = True
                    elif not plu:
                        gh["no_project_list"] = True
                if not valid:
                    gh["civicjson_errors"] = [
                        error.message 
                        for error in sorted(v.iter_errors(civicjson), key=str)
                    ]
                    print(gh["civicjson_errors"])
            else:
                print(gh["name"])
        except ValueError as e:
            # When we have a bad json file
            civicjson = None
            gh["civicjson"] = {}
            gh["civicjson_is_valid"] = False
            gh["civicjson_errors"] = [str(e)]
        except RateLimitException as e:
            print("**** Rate limited ****: %s" % e)
            break
        annotated_projects.append(gh)

    print( "%i annotated projects" % len(annotated_projects) )

