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
        advancedMetrics: {
          consistencyScore: 0,
          streakPower: 0,
          owlIndex: 0,
          weekendWarriorScore: 0,
          darkCoderPercentage: 0,
          commitVelocity: 0,
          bugSlayerScore: 0,
          collaborationIndex: 0,
          repoDiversityIndex: 0,
          commitsByHour: new Array(24).fill(0),
          commitsByDay: new Array(7).fill(0),
          issuesOpened: 0,
          issuesClosed: 0,
          ownRepoContributions: 0,
          externalRepoContributions: 0
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

      // Calculate advanced metrics
      await this.calculateAdvancedMetrics(username, stats, period);

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
      const repos = await this.getAllUserRepos(username);

      let totalCommits = 0;
      let totalPRs = 0;
      let totalIssues = 0;
      let totalReviews = 0;

      // Get contributions from user's repositories
      // Process more repos but with better rate limiting
      const reposToProcess = repos.slice(0, Math.min(repos.length, 50));
      for (const repo of reposToProcess) {
        try {
          // Get commits for this repo with proper date filtering
          const commitsParams = {
            owner: repo.owner.login,
            repo: repo.name,
            author: username,
            per_page: 100
          };

          if (period !== 'all') {
            commitsParams.since = dateRange.start + 'T00:00:00Z';
            if (dateRange.end) {
              commitsParams.until = dateRange.end + 'T23:59:59Z';
            }
          }

          const commitsResponse = await this.octokit.repos.listCommits(commitsParams);

          totalCommits += commitsResponse.data.length;

          // Get PRs for this repo
          const prsResponse = await this.octokit.pulls.list({
            owner: repo.owner.login,
            repo: repo.name,
            creator: username,
            state: 'all',
            per_page: 100
          });

          // Filter PRs by date if needed
          if (period !== 'all') {
            const sinceDate = new Date(dateRange.start);
            totalPRs += prsResponse.data.filter(pr => new Date(pr.created_at) >= sinceDate).length;
          } else {
            totalPRs += prsResponse.data.length;
          }

          // Get issues for this repo
          const issuesResponse = await this.octokit.issues.listForRepo({
            owner: repo.owner.login,
            repo: repo.name,
            creator: username,
            state: 'all',
            per_page: 100
          });

          // Filter out PRs from issues and filter by date
          const actualIssues = issuesResponse.data.filter(issue => !issue.pull_request);
          if (period !== 'all') {
            const sinceDate = new Date(dateRange.start);
            totalIssues += actualIssues.filter(issue => new Date(issue.created_at) >= sinceDate).length;
          } else {
            totalIssues += actualIssues.length;
          }

        } catch (repoError) {
          // Skip repos we can't access
          console.log(`Skipping repo ${repo.name}: ${repoError.message}`);
          continue;
        }
      }

      // Use search API as additional data source (not replacement)
      try {
        const commitQuery = period === 'all'
          ? `author:${username}`
          : `author:${username} committer-date:>=${dateRange.start}${dateRange.end ? '...' + dateRange.end : ''}`;

        const commitSearch = await this.octokit.search.commits({
          q: commitQuery,
          per_page: 100
        });

        // Use search API data if it's significantly higher (indicates we missed some repos)
        if (commitSearch.data.total_count > totalCommits * 1.5) {
          totalCommits = commitSearch.data.total_count;
        }

        const prQuery = period === 'all'
          ? `author:${username} type:pr`
          : `author:${username} type:pr created:>=${dateRange.start}${dateRange.end ? '..' + dateRange.end : ''}`;

        const prSearch = await this.octokit.search.issuesAndPullRequests({
          q: prQuery,
          per_page: 100
        });

        if (prSearch.data.total_count > totalPRs * 1.5) {
          totalPRs = prSearch.data.total_count;
        }

        const issueQuery = period === 'all'
          ? `author:${username} type:issue`
          : `author:${username} type:issue created:>=${dateRange.start}${dateRange.end ? '..' + dateRange.end : ''}`;

        const issueSearch = await this.octokit.search.issuesAndPullRequests({
          q: issueQuery,
          per_page: 100
        });

        if (issueSearch.data.total_count > totalIssues * 1.5) {
          totalIssues = issueSearch.data.total_count;
        }
      } catch (searchError) {
        console.log('Search API supplementation failed:', searchError.message);
      }

      stats.contributions.commits = totalCommits;
      stats.contributions.pullRequests = totalPRs;
      stats.contributions.issues = totalIssues;
      stats.contributions.reviews = totalReviews;

      console.log(`Found contributions for ${username}: commits=${totalCommits}, PRs=${totalPRs}, issues=${totalIssues}`);

    } catch (error) {
      console.error('Error fetching contribution stats:', error);
      // Set minimal defaults and mark as estimated
      stats.contributions = {
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0
      };
      stats.isEstimated = true;
      stats.estimationReason = 'Unable to fetch contribution data from GitHub API';
    }
  }

  getDateRange(period) {
    const now = new Date();
    const ranges = {
      'month': () => {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      },
      'year': () => {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      },
      'last-year': () => {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      },
      'last-month': () => {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      },
      'all': () => ({
        start: '2008-01-01',
        end: now.toISOString().split('T')[0]
      })
    };

    return ranges[period] ? ranges[period]() : ranges['all']();
  }

  async calculateAdvancedMetrics(username, stats, period) {
    try {
      const repos = await this.getAllUserRepos(username);
      const dateRange = this.getDateRange(period);

      // Initialize time-based data collection
      const timeBasedData = {
        commitsByHour: new Array(24).fill(0),
        commitsByDay: new Array(7).fill(0),
        commitsByDate: new Map(),
        totalActualCommits: 0
      };

      // Collect real commit timing data
      await this.collectTimeBasedData(username, repos, dateRange, timeBasedData);

      // Use the actual contribution data we already have
      const totalContributions = Object.values(stats.contributions).reduce((a, b) => a + b, 0);
      const totalDays = this.getDaysInPeriod(period);

      // Calculate consistency based on actual commit days
      const activeDays = timeBasedData.commitsByDate.size;
      stats.advancedMetrics.consistencyScore = totalDays > 0 ? Math.min(Math.round((activeDays / totalDays) * 100), 100) : 0;

      // Calculate Streak Power based on actual commit patterns
      const streakData = this.calculateStreakData(timeBasedData.commitsByDate, dateRange);
      stats.advancedMetrics.streakPower = streakData.currentStreak > 0 ?
        Math.round(streakData.currentStreak * Math.log(1 + streakData.maxStreak)) : 0;

      // Calculate real time-based metrics
      const timeMetrics = this.calculateTimeMetrics(timeBasedData);
      stats.advancedMetrics.owlIndex = timeMetrics.owlIndex;
      stats.advancedMetrics.weekendWarriorScore = timeMetrics.weekendWarriorScore;
      stats.advancedMetrics.darkCoderPercentage = timeMetrics.darkCoderPercentage;

      // Set the real time distribution data
      stats.advancedMetrics.commitsByHour = timeBasedData.commitsByHour;
      stats.advancedMetrics.commitsByDay = timeBasedData.commitsByDay;

      // Calculate Commit Velocity based on actual contributions
      const monthsActive = this.getMonthsInPeriod(period);
      stats.advancedMetrics.commitVelocity = monthsActive > 0 ? Math.round(stats.contributions.commits / monthsActive) : 0;

      // Calculate improved Repo Diversity Index
      stats.advancedMetrics.repoDiversityIndex = this.calculateImprovedShannonEntropy(repos, stats.languages);

      // Calculate realistic Collaboration Index
      const ownRepos = repos.filter(r => r.owner.login === username).length;
      const totalRepos = repos.length;
      stats.advancedMetrics.collaborationIndex = totalRepos > 0 ?
        Math.round(((totalRepos - ownRepos) / totalRepos) * 100) / 100 : 0;

      // Calculate Bug Slayer Score with better logic
      await this.calculateBugSlayerScore(username, stats, repos, dateRange);

      // Calculate repository contributions split
      stats.advancedMetrics.ownRepoContributions = Math.round(stats.contributions.commits * (ownRepos / Math.max(totalRepos, 1)));
      stats.advancedMetrics.externalRepoContributions = stats.contributions.commits - stats.advancedMetrics.ownRepoContributions;

    } catch (error) {
      console.error('Error calculating advanced metrics:', error);
      // Set reasonable defaults if calculation fails
      this.setDefaultAdvancedMetrics(stats.advancedMetrics);
    }
  }

  async collectTimeBasedData(username, repos, dateRange, timeBasedData) {
    const reposToAnalyze = repos.slice(0, 30); // Limit for performance

    for (const repo of reposToAnalyze) {
      try {
        const commitsParams = {
          owner: repo.owner.login,
          repo: repo.name,
          author: username,
          per_page: 100
        };

        if (dateRange.start !== '2008-01-01') {
          commitsParams.since = dateRange.start + 'T00:00:00Z';
          if (dateRange.end) {
            commitsParams.until = dateRange.end + 'T23:59:59Z';
          }
        }

        const commits = await this.octokit.repos.listCommits(commitsParams);

        commits.data.forEach(commit => {
          const date = new Date(commit.commit.author.date);
          const hour = date.getHours();
          const dayOfWeek = date.getDay();
          const dateString = date.toISOString().split('T')[0];

          timeBasedData.commitsByHour[hour]++;
          timeBasedData.commitsByDay[dayOfWeek]++;
          timeBasedData.commitsByDate.set(dateString,
            (timeBasedData.commitsByDate.get(dateString) || 0) + 1);
          timeBasedData.totalActualCommits++;
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        // Skip repos we can't access
        console.log(`Skipping time data for repo ${repo.name}: ${error.message}`);
        continue;
      }
    }
  }

  setDefaultAdvancedMetrics(metrics) {
    metrics.consistencyScore = 0;
    metrics.streakPower = 0;
    metrics.owlIndex = 1.0;
    metrics.weekendWarriorScore = 0;
    metrics.darkCoderPercentage = 0;
    metrics.commitVelocity = 0;
    metrics.bugSlayerScore = 0;
    metrics.collaborationIndex = 0;
    metrics.repoDiversityIndex = 0;
    metrics.commitsByHour = new Array(24).fill(0);
    metrics.commitsByDay = new Array(7).fill(0);
    metrics.issuesOpened = 0;
    metrics.issuesClosed = 0;
    metrics.ownRepoContributions = 0;
    metrics.externalRepoContributions = 0;
  }


  calculateImprovedShannonEntropy(repos, languages) {
    if (!languages || Object.keys(languages).length <= 1) return 0;

    const languageEntries = Object.entries(languages);
    if (languageEntries.length === 0) return 0;

    // Calculate entropy based on language distribution
    const totalRepos = languageEntries.reduce((sum, [, count]) => sum + count, 0);
    if (totalRepos === 0) return 0;

    let entropy = 0;
    languageEntries.forEach(([, count]) => {
      const probability = count / totalRepos;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });

    return Math.round(entropy * 100) / 100;
  }

  calculateStreakData(commitsByDate, dateRange) {
    if (commitsByDate.size === 0) {
      return { currentStreak: 0, maxStreak: 0 };
    }

    const sortedDates = Array.from(commitsByDate.keys()).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 1;

    // Calculate current streak (from most recent date backwards)
    const today = new Date();
    let checkDate = new Date(today);

    // Check if there was activity in the last few days
    for (let i = 0; i < 7; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (commitsByDate.has(dateStr)) {
        currentStreak++;
      } else if (currentStreak > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate max streak
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    return { currentStreak: Math.min(currentStreak, 100), maxStreak: Math.min(maxStreak, 365) };
  }

  calculateTimeMetrics(timeBasedData) {
    const { commitsByHour, commitsByDay, totalActualCommits } = timeBasedData;

    if (totalActualCommits === 0) {
      return {
        owlIndex: 1.0,
        weekendWarriorScore: 20,
        darkCoderPercentage: 10
      };
    }

    // Calculate Night Owl Index (night vs morning commits)
    const nightCommits = commitsByHour.slice(22, 24).concat(commitsByHour.slice(0, 6)).reduce((a, b) => a + b, 0);
    const morningCommits = commitsByHour.slice(6, 12).reduce((a, b) => a + b, 0);
    const owlIndex = morningCommits > 0 ? Math.round((nightCommits / morningCommits) * 100) / 100 :
                     nightCommits > 0 ? 3.0 : 1.0;

    // Calculate Weekend Warrior Score (weekend vs weekday commits)
    const weekendCommits = commitsByDay[0] + commitsByDay[6]; // Sunday + Saturday
    const weekdayCommits = commitsByDay.slice(1, 6).reduce((a, b) => a + b, 0);
    const weekendWarriorScore = weekdayCommits > 0 ?
      Math.round((weekendCommits / (weekdayCommits + weekendCommits)) * 100) : 0;

    // Calculate Dark Coder Percentage (commits after midnight)
    const darkCommits = commitsByHour.slice(0, 6).reduce((a, b) => a + b, 0);
    const darkCoderPercentage = Math.round((darkCommits / totalActualCommits) * 100);

    return {
      owlIndex: Math.min(Math.max(owlIndex, 0.1), 5.0),
      weekendWarriorScore: Math.min(weekendWarriorScore, 100),
      darkCoderPercentage: Math.min(darkCoderPercentage, 100)
    };
  }

  async calculateBugSlayerScore(username, stats, repos, dateRange) {
    try {
      let totalIssuesOpened = 0;
      let totalIssuesClosed = 0;

      // Sample a few repositories to get issue data
      const sampleRepos = repos.slice(0, 10);

      for (const repo of sampleRepos) {
        try {
          // Get issues created by user
          const createdIssues = await this.octokit.issues.listForRepo({
            owner: repo.owner.login,
            repo: repo.name,
            creator: username,
            state: 'all',
            per_page: 50
          });

          const actualIssues = createdIssues.data.filter(issue => !issue.pull_request);
          totalIssuesOpened += actualIssues.length;
          totalIssuesClosed += actualIssues.filter(issue => issue.state === 'closed').length;

          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        } catch (error) {
          continue;
        }
      }

      stats.advancedMetrics.issuesOpened = totalIssuesOpened;
      stats.advancedMetrics.issuesClosed = totalIssuesClosed;
      stats.advancedMetrics.bugSlayerScore = totalIssuesOpened > 0 ?
        Math.round((totalIssuesClosed / totalIssuesOpened) * 100) / 100 : 0;

    } catch (error) {
      console.error('Error calculating bug slayer score:', error);
      stats.advancedMetrics.bugSlayerScore = 0;
    }
  }

  getDaysInPeriod(period) {
    const now = new Date();
    const dateRange = this.getDateRange(period);

    if (period === 'all') {
      // Calculate days from GitHub founding to now
      const start = new Date('2008-01-01');
      return Math.floor((now - start) / (1000 * 60 * 60 * 24));
    }

    const start = new Date(dateRange.start);
    const end = dateRange.end ? new Date(dateRange.end) : now;
    return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  }

  getMonthsInPeriod(period) {
    switch(period) {
      case 'month':
      case 'last-month':
        return 1;
      case 'year':
      case 'last-year':
        return 12;
      default: {
        // For 'all', calculate months since GitHub founding
        const now = new Date();
        const start = new Date('2008-01-01');
        return Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30.44)));
      }
    }
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