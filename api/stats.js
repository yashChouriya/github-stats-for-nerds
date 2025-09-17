const GitHubClient = require('../lib/github-client');
const SVGGenerator = require('../utils/svg-generator');

module.exports = async (req, res) => {
  try {
    const {
      username,
      theme = 'dark',
      card = 'stats',
      include_private = 'true',
      period = 'all'
    } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Validate period parameter
    const validPeriods = ['all', 'year', 'month', 'last-year', 'last-month'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: `Invalid period. Valid options: ${validPeriods.join(', ')}`
      });
    }

    // Get GitHub token from environment variables
    const token = process.env.GITHUB_TOKEN;
    if (!token && include_private === 'true') {
      return res.status(400).json({
        error: 'GitHub token required for private repository access. Set GITHUB_TOKEN environment variable.'
      });
    }

    // Initialize GitHub client
    const githubClient = new GitHubClient(token);
    const svgGenerator = new SVGGenerator();

    // Set cache headers
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes

    try {
      if (card === 'languages') {
        // Generate language stats card
        const languageStats = await githubClient.getLanguageStats(username);
        const svg = svgGenerator.generateLanguageCard(languageStats, theme);
        return res.send(svg);
      }
      else if (card === 'contributions') {
        // Generate contributions card
        const stats = await githubClient.getUserStats(username, period);
        const svg = svgGenerator.generateContributionCard(stats.contributions, theme, { period });
        return res.send(svg);
      }
      else if (card === 'trophies') {
        // Generate trophies card
        const stats = await githubClient.getUserStats(username, period);
        const svg = svgGenerator.generateTrophyCard(stats, theme);
        return res.send(svg);
      }
      else {
        // Generate main stats card (default)
        const stats = await githubClient.getUserStats(username, period);
        const svg = svgGenerator.generateStatsCard(stats, theme, { period });
        return res.send(svg);
      }
    } catch (githubError) {
      console.error('GitHub API Error:', githubError);

      // Generate error SVG
      const errorSvg = generateErrorSvg(
        githubError.status === 404 ? 'User not found' : 'Unable to fetch stats',
        theme
      );
      return res.send(errorSvg);
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function generateErrorSvg(message, theme = 'dark') {
  const colors = {
    dark: { bg: '#0d1117', border: '#30363d', text: '#c9d1d9', error: '#f85149' },
    light: { bg: '#ffffff', border: '#d0d7de', text: '#24292f', error: '#d1242f' }
  };
  const color = colors[theme];

  return `
    <svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .error-text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${color.error}; }
        .error-message { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${color.text}; }
      </style>

      <rect data-testid="card-bg" x="0.5" y="0.5" rx="4.5" height="99%" stroke="${color.border}" width="399" fill="${color.bg}" stroke-opacity="1"/>

      <g transform="translate(25, 35)">
        <text class="error-text" y="0">⚠️ Error</text>
        <text class="error-message" y="25">${message}</text>
      </g>
    </svg>
  `;
}