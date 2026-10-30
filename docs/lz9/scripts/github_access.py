"""Use a separately injected Projects credential without printing or persisting its value."""
import os

def github_env(projects=True):
    result=os.environ.copy()
    if projects and result.get('GH_PROJECTS_TOKEN'):
        result['GH_TOKEN']=result['GH_PROJECTS_TOKEN']
    return result
