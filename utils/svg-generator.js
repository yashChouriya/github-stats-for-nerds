class SVGGenerator {
  constructor() {
    this.themes = {
      dark: {
        bg: '#0d1117',
        border: '#30363d',
        text: '#c9d1d9',
        textSecondary: '#8b949e',
        accent: '#58a6ff',
        success: '#3fb950',
        warning: '#d29922',
        error: '#f85149'
      },
      light: {
        bg: '#ffffff',
        border: '#d0d7de',
        text: '#24292f',
        textSecondary: '#656d76',
        accent: '#0969da',
        success: '#1a7f37',
        warning: '#9a6700',
        error: '#d1242f'
      }
    };
  }

  generateStatsCard(stats, theme = 'dark', options = {}) {
    const colors = this.themes[theme];
    const width = options.width || 495;
    const height = options.height || 195;

    const totalContributions = Object.values(stats.contributions).reduce((a, b) => a + b, 0);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
          .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.text}; }
          .stat { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.text}; }
          .stat-value { font: 700 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.accent}; }
          .stat-label { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.textSecondary}; }
        </style>

        <rect data-testid="card-bg" x="0.5" y="0.5" rx="4.5" height="99%" stroke="${colors.border}" width="${width - 1}" fill="${colors.bg}" stroke-opacity="1"/>

        <g data-testid="card-title" transform="translate(25, 25)">
          <text x="0" y="0" class="header" data-testid="header">${stats.user.name || stats.user.login}'s GitHub Stats</text>
        </g>

        <g data-testid="main-card-body" transform="translate(25, 55)">
          <g data-testid="stats" transform="translate(0, 0)">
            <g transform="translate(0, 0)">
              <text class="stat" y="12.5">Total Stars:</text>
              <text class="stat-value" x="120" y="12.5">${stats.totalStars.toLocaleString()}</text>
            </g>
            <g transform="translate(220, 0)">
              <text class="stat" y="12.5">Total Commits:</text>
              <text class="stat-value" x="130" y="12.5">${totalContributions.toLocaleString()}</text>
            </g>

            <g transform="translate(0, 25)">
              <text class="stat" y="12.5">Total PRs:</text>
              <text class="stat-value" x="120" y="12.5">${stats.contributions.pullRequests.toLocaleString()}</text>
            </g>
            <g transform="translate(220, 25)">
              <text class="stat" y="12.5">Total Issues:</text>
              <text class="stat-value" x="130" y="12.5">${stats.contributions.issues.toLocaleString()}</text>
            </g>

            <g transform="translate(0, 50)">
              <text class="stat" y="12.5">Total Repos:</text>
              <text class="stat-value" x="120" y="12.5">${stats.totalRepos.toLocaleString()}</text>
            </g>
            <g transform="translate(220, 50)">
              <text class="stat" y="12.5">Private Repos:</text>
              <text class="stat-value" x="130" y="12.5">${stats.privateRepos.toLocaleString()}</text>
            </g>

            <g transform="translate(0, 75)">
              <text class="stat" y="12.5">Organizations:</text>
              <text class="stat-value" x="120" y="12.5">${stats.organizations.toLocaleString()}</text>
            </g>
            <g transform="translate(220, 75)">
              <text class="stat" y="12.5">PR Reviews:</text>
              <text class="stat-value" x="130" y="12.5">${stats.contributions.reviews.toLocaleString()}</text>
            </g>
          </g>
        </g>
      </svg>
    `;
  }

  generateLanguageCard(languageStats, theme = 'dark', options = {}) {
    const colors = this.themes[theme];
    const width = options.width || 300;
    const height = options.height || 200;

    const languages = Object.entries(languageStats)
      .sort(([,a], [,b]) => parseFloat(b) - parseFloat(a))
      .slice(0, 5);

    const languageColors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#3178c6',
      'Python': '#3572A5',
      'Java': '#b07219',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'PHP': '#4F5D95',
      'C++': '#f34b7d',
      'C': '#555555',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Swift': '#fa7343',
      'Kotlin': '#A97BFF',
      'Dart': '#00B4AB',
      'Ruby': '#701516'
    };

    let yOffset = 0;

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
          .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.text}; }
          .lang-name { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.text}; }
          .lang-percent { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.textSecondary}; }
        </style>

        <rect data-testid="card-bg" x="0.5" y="0.5" rx="4.5" height="99%" stroke="${colors.border}" width="${width - 1}" fill="${colors.bg}" stroke-opacity="1"/>

        <g data-testid="card-title" transform="translate(25, 25)">
          <text x="0" y="0" class="header">Most Used Languages</text>
        </g>

        <g data-testid="main-card-body" transform="translate(25, 55)">
          ${languages.map(([lang, percent], index) => {
            const y = index * 25;
            const color = languageColors[lang] || colors.accent;
            return `
              <g transform="translate(0, ${y})">
                <circle cx="6" cy="8" r="6" fill="${color}"/>
                <text class="lang-name" x="20" y="12">${lang}</text>
                <text class="lang-percent" x="200" y="12">${percent}%</text>
              </g>
            `;
          }).join('')}
        </g>
      </svg>
    `;
  }

  generateContributionCard(contributions, theme = 'dark', options = {}) {
    const colors = this.themes[theme];
    const width = options.width || 400;
    const height = options.height || 160;

    const total = Object.values(contributions).reduce((a, b) => a + b, 0);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
          .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.text}; }
          .contrib-stat { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.text}; }
          .contrib-value { font: 700 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.accent}; }
        </style>

        <rect data-testid="card-bg" x="0.5" y="0.5" rx="4.5" height="99%" stroke="${colors.border}" width="${width - 1}" fill="${colors.bg}" stroke-opacity="1"/>

        <g data-testid="card-title" transform="translate(25, 25)">
          <text x="0" y="0" class="header">Contributions (Last Year)</text>
        </g>

        <g data-testid="main-card-body" transform="translate(25, 55)">
          <g transform="translate(0, 0)">
            <text class="contrib-value" x="0" y="15">${contributions.commits.toLocaleString()}</text>
            <text class="contrib-stat" x="0" y="30">Commits</text>
          </g>
          <g transform="translate(100, 0)">
            <text class="contrib-value" x="0" y="15">${contributions.pullRequests.toLocaleString()}</text>
            <text class="contrib-stat" x="0" y="30">Pull Requests</text>
          </g>
          <g transform="translate(200, 0)">
            <text class="contrib-value" x="0" y="15">${contributions.issues.toLocaleString()}</text>
            <text class="contrib-stat" x="0" y="30">Issues</text>
          </g>
          <g transform="translate(280, 0)">
            <text class="contrib-value" x="0" y="15">${contributions.reviews.toLocaleString()}</text>
            <text class="contrib-stat" x="0" y="30">Reviews</text>
          </g>

          <g transform="translate(0, 60)">
            <text class="header" x="0" y="15">Total: ${total.toLocaleString()}</text>
          </g>
        </g>
      </svg>
    `;
  }
}

module.exports = SVGGenerator;