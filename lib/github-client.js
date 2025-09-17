const { Octokit } = require('@octokit/rest');

class GitHubClient {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getUserStats(username, period = 'all') {
    try {
      const [user, repos, orgs] = await Promise.all([
        this.octokit.users.getByUsername({ username }),
        this.getAllUserRepos(username),
        this.getUserOrgs(username)
      ]);

      const stats = {
        user: user.data,
        totalRepos: repos.length,
        publicRepos: repos.filter(repo => !repo.private).length,
        privateRepos: repos.filter(repo => repo.private).length,
        organizations: orgs.length,
        languages: {},
        totalStars: 0,
        totalForks: 0,
        totalCommits: 0,
        contributions: {
          commits: 0,
          pullRequests: 0,
          issues: 0,
          reviews: 0
        },
        period: period
      };

      // Calculate language distribution and repo stats
      repos.forEach(repo => {
        if (repo.language) {
          stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1;
        }
        stats.totalStars += repo.stargazers_count;
        stats.totalForks += repo.forks_count;
      });

      // Get detailed contribution stats with period filtering
      await this.getContributionStats(username, stats, period);

      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  async getAllUserRepos(username) {
    const repos = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await this.octokit.repos.listForUser({
          username,
          type: 'all', // public, private, forks, sources, member
          per_page: 100,
          page
        });

        repos.push(...response.data);
        hasNextPage = response.data.length === 100;
        page++;
      } catch (error) {
        if (error.status === 403) {
          // Rate limit hit, break the loop
          break;
        }
        throw error;
      }
    }

    // Also get repositories from authenticated user (includes private ones)
    try {
      let authPage = 1;
      let authHasNextPage = true;

      while (authHasNextPage) {
        const authResponse = await this.octokit.repos.listForAuthenticatedUser({
          visibility: 'all',
          affiliation: 'owner,collaborator,organization_member',
          per_page: 100,
          page: authPage
        });

        // Merge with existing repos, avoiding duplicates
        authResponse.data.forEach(repo => {
          if (!repos.find(r => r.id === repo.id)) {
            repos.push(repo);
          }
        });

        authHasNextPage = authResponse.data.length === 100;
        authPage++;
      }
    } catch (error) {
      // If we can't get authenticated user repos, continue with what we have
      console.log('Could not fetch authenticated user repos:', error.message);
    }

    return repos;
  }

  async getUserOrgs(username) {
    try {
      const response = await this.octokit.orgs.listForUser({
        username,
        per_page: 100
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user orgs:', error);
      return [];
    }
  }

  async getContributionStats(username, stats, period = 'all') {
    try {
      const dateRange = this.getDateRange(period);

      // Search for commits by the user
      const commitQuery = period === 'all'
        ? `author:${username}`
        : `author:${username} committer-date:>=${dateRange.start}`;

      const commitSearch = await this.octokit.search.commits({
        q: commitQuery,
        per_page: 100
      });

      stats.contributions.commits = commitSearch.data.total_count;

      // Search for pull requests
      const prQuery = period === 'all'
        ? `author:${username} type:pr`
        : `author:${username} type:pr created:>=${dateRange.start}`;

      const prSearch = await this.octokit.search.issuesAndPullRequests({
        q: prQuery,
        per_page: 100
      });

      stats.contributions.pullRequests = prSearch.data.total_count;

      // Search for issues
      const issueQuery = period === 'all'
        ? `author:${username} type:issue`
        : `author:${username} type:issue created:>=${dateRange.start}`;

      const issueSearch = await this.octokit.search.issuesAndPullRequests({
        q: issueQuery,
        per_page: 100
      });

      stats.contributions.issues = issueSearch.data.total_count;

      // Search for PR reviews
      const reviewQuery = period === 'all'
        ? `reviewed-by:${username} type:pr`
        : `reviewed-by:${username} type:pr created:>=${dateRange.start}`;

      const reviewSearch = await this.octokit.search.issuesAndPullRequests({
        q: reviewQuery,
        per_page: 100
      });

      stats.contributions.reviews = reviewSearch.data.total_count;

    } catch (error) {
      console.error('Error fetching contribution stats:', error);
      // Don't throw, just set to 0 if we can't get the data
      stats.contributions = {
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0
      };
    }
  }

  getDateRange(period) {
    const now = new Date();
    const ranges = {
      'month': () => {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: start.toISOString().split('T')[0] };
      },
      'year': () => {
        const start = new Date(now.getFullYear(), 0, 1);
        return { start: start.toISOString().split('T')[0] };
      },
      'last-year': () => {
        const start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        return { start: start.toISOString().split('T')[0] };
      },
      'last-month': () => {
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        return { start: start.toISOString().split('T')[0] };
      },
      'all': () => ({ start: '2008-01-01' }) // GitHub's founding year
    };

    return ranges[period] ? ranges[period]() : ranges['all']();
  }

  async getLanguageStats(username) {
    try {
      const repos = await this.getAllUserRepos(username);
      const languageStats = {};
      let totalBytes = 0;

      for (const repo of repos.slice(0, 50)) { // Limit to avoid rate limiting
        try {
          const languages = await this.octokit.repos.listLanguages({
            owner: repo.owner.login,
            repo: repo.name
          });

          for (const [language, bytes] of Object.entries(languages.data)) {
            languageStats[language] = (languageStats[language] || 0) + bytes;
            totalBytes += bytes;
          }
        } catch (error) {
          // Skip repos we can't access
          continue;
        }
      }

      // Convert to percentages
      const languagePercentages = {};
      for (const [language, bytes] of Object.entries(languageStats)) {
        languagePercentages[language] = ((bytes / totalBytes) * 100).toFixed(1);
      }

      return languagePercentages;
    } catch (error) {
      console.error('Error fetching language stats:', error);
      return {};
    }
  }
}

module.exports = GitHubClient;