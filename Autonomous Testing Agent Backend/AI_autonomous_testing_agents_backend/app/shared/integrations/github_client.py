import httpx
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class GitHubClient:
    def __init__(self, token: str, repo: str):
        """
        :param token: GitHub PAT
        :param repo: "owner/repo" string
        """
        self.token = token
        # Automatically strip .git from the end if the user included it by mistake
        if repo.endswith(".git"):
            repo = repo[:-4]
        # Automatically strip github url if user pasted full url
        if repo.startswith("https://github.com/"):
            repo = repo.replace("https://github.com/", "")
        elif repo.startswith("http://github.com/"):
            repo = repo.replace("http://github.com/", "")
        self.repo = repo
        self.base_url = f"https://api.github.com/repos/{self.repo}"
        self.headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if self.token and self.token.strip():
            self.headers["Authorization"] = f"token {self.token.strip()}"

    async def get_default_branch(self) -> str:
        async with httpx.AsyncClient() as client:
            res = await client.get(self.base_url, headers=self.headers)
            if res.status_code == 404:
                raise Exception("Repository not found. Please check the repository name (e.g. 'owner/repo') and ensure it is public, or that your PAT has access.")
            elif res.status_code == 401:
                raise Exception("Unauthorized. Please check your Personal Access Token (PAT).")
            res.raise_for_status()
            return res.json().get("default_branch", "main")

    async def get_branch_ref(self, branch: str) -> Optional[str]:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{self.base_url}/git/refs/heads/{branch}", headers=self.headers)
            if res.status_code == 200:
                return res.json().get("object", {}).get("sha")
            return None

    async def create_branch(self, branch_name: str, base_branch: str = None) -> bool:
        if not base_branch:
            base_branch = await self.get_default_branch()
        
        base_sha = await self.get_branch_ref(base_branch)
        if not base_sha:
            logger.error(f"Base branch {base_branch} not found in {self.repo}")
            return False

        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/git/refs",
                headers=self.headers,
                json={
                    "ref": f"refs/heads/{branch_name}",
                    "sha": base_sha
                }
            )
            return res.status_code == 201

    async def push_file(self, branch: str, path: str, content: str, message: str) -> bool:
        """ Pushes a file directly to the given branch. Assumes branch exists. """
        file_sha = None
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{self.base_url}/contents/{path}?ref={branch}", headers=self.headers)
            if res.status_code == 200:
                file_sha = res.json().get("sha")

        encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
        payload = {
            "message": message,
            "content": encoded_content,
            "branch": branch
        }
        if file_sha:
            payload["sha"] = file_sha

        async with httpx.AsyncClient() as client:
            res = await client.put(f"{self.base_url}/contents/{path}", headers=self.headers, json=payload)
            return res.status_code in [200, 201]

    async def create_pull_request(self, title: str, body: str, head_branch: str, base_branch: str = None) -> Optional[str]:
        if not base_branch:
            base_branch = await self.get_default_branch()
            
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/pulls",
                headers=self.headers,
                json={
                    "title": title,
                    "body": body,
                    "head": head_branch,
                    "base": base_branch
                }
            )
            if res.status_code == 201:
                return res.json().get("html_url")
            else:
                logger.error(f"Failed to create PR: {res.text}")
                return None

    async def update_commit_status(self, sha: str, state: str, context: str, description: str, target_url: str = None) -> bool:
        """
        Updates the commit status on GitHub for CI/CD blocking/reporting.
        :param state: error, failure, pending, or success
        """
        payload = {
            "state": state,
            "context": context,
            "description": description
        }
        if target_url:
            payload["target_url"] = target_url

        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/statuses/{sha}",
                headers=self.headers,
                json=payload
            )
            if res.status_code == 201:
                return True
            else:
                logger.error(f"Failed to update commit status: {res.text}")
                return False
