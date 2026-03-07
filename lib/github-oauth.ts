/**
 * GitHub API utilities.
 * Token is obtained from Clerk (see lib/github-clerk.ts).
 */

export interface GitHubOAuthRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string; avatar_url: string };
  private: boolean;
  default_branch: string;
  language: string | null;
  description: string | null;
  updated_at: string;
}

export async function listUserRepos(token: string): Promise<GitHubOAuthRepo[]> {
  const repos: GitHubOAuthRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&sort=updated&type=all&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!res.ok) break;

    const data = await res.json();
    repos.push(...data);

    if (data.length < 100) break;
    page++;
  }

  return repos;
}
