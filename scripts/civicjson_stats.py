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
from urllib.parse import urljoin,urlparse
import json
import os,os.path
from jsonschema import Draft4Validator

CFAPI = "https://api.codeforamerica.org/api/"
CACHE = ".cache"
GITHUB_AUTH = os.environ.get("GITHUB_TOKEN","")

GITHUB_CONTENT_API_URL = 'https://api.github.com/repos{repo_path}/contents/{file_path}'

def github_api(url,headers=None):
    resp = requests.get(url, auth=GITHUB_AUTH, headers=headers)
    if resp.status_code == 403:
        raise Exception(resp.text)
    return resp
    
def fetchall(url,cache=None):
    print("Fetching %s"%url)
    cache_file = os.path.join(CACHE,"%s.json"%cache)
    if cache and os.path.exists(cache_file):
        return json.loads(open(cache_file).read())
    n = url 
    while n != None and len(result) < 50:
        resp = requests.get(n)
        print(".")
        o = resp.json()
        result += o["objects"]
        n = o["pages"].get("next",None)

    if cache:
        with open(cache_file,"w") as f:
            f.write(json.dumps(result,indent=1))
    return result
        
def get_brigades(cache=True):
    brigades = fetchall(urljoin(CFAPI,"organizations","?type=Brigade"),cache="_brigades")

    print("Fetched %i organizations" % len(brigades))
    return brigades

def get_project_civicjson(code_url):
    github_path = urlparse(code_url).path.rstrip('.git')
    civic_url = GITHUB_CONTENT_API_URL.format(repo_path=github_path, file_path='civic.json')
    request_headers = {'Accept': 'application/vnd.github.v3.raw'}
    response = github_api(civic_url, headers=request_headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(code_url,response.status_code)
    return None
   

if __name__ == "__main__":
    if os.environ.get("GITHUB_TOKEN"):
        print("Using Github Token")

    if not os.path.exists(CACHE):
        os.mkdir(CACHE)

    project_cache = os.path.join(CACHE,"projects.json")
    if not os.path.exists(project_cache):
        # get brigades
        brigades = get_brigades()

        # and brigade projects
        projects = [] 
        for br in brigades[:5]:
            print("getting projects for %s" % br["name"])
            b_projects = fetchall( br["all_projects"] )
            print("... %i projects retrieved" % len(b_projects) )
            projects += b_projects 
        
        with open(project_cache,"w") as f:
            f.write( json.dumps(projects, indent=1) )
        print("Saved %i projects" % len(projects) )

    else:
        with open(project_cache,"r") as f:
            projects = json.loads(f.read())

    print("loaded %i projects" % len(projects))
    #print(projects)
    # Check for Civic.json
    github_hosted = [ p for p in projects if p.get("code_url") and "github" in p.get("code_url","") ]
    print("%i of %i code-hosting on github" % (len(github_hosted),len(projects)))
  
     
    civicjson_schema = requests.get(
        'https://raw.githubusercontent.com/DCgov/civic.json/master/schema.json'
    ).json()
    v = Draft4Validator(civicjson_schema)

    # Check for Civicjson and validate
    for gh in github_hosted:
        civicjson = get_project_civicjson(gh["code_url"])
        if civicjson:
            valid = v.is_valid(civicjson)
            print(gh["name"], valid and "VALID" or "NOT-VALID")
            gh["civicjson"] = civicjson
            gh["civicjson_is_valid"] = valid
            if not valid:
                gh["civicjson_errors"] = [error for error in sorted(v.iter_errors(civicjson), key=str)]
                print(gh["civicjson_errors"])
        else:
            print(gh["name"])


