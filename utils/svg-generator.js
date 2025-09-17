class SVGGenerator {
  constructor() {
    this.themes = {
      dark: {
        bg: 'url(#gradient-bg-dark)',
        border: '#30363d',
        text: '#ffffff',
        textSecondary: '#8b949e',
        accent: '#58a6ff',
        accent2: '#7c3aed',
        success: '#3fb950',
        warning: '#f59e0b',
        error: '#f85149',
        gradientStart: '#0d1117',
        gradientEnd: '#161b22'
      },
      light: {
        bg: 'url(#gradient-bg-light)',
        border: '#d0d7de',
        text: '#24292f',
        textSecondary: '#656d76',
        accent: '#0969da',
        accent2: '#7c3aed',
        success: '#1a7f37',
        warning: '#9a6700',
        error: '#d1242f',
        gradientStart: '#ffffff',
        gradientEnd: '#f6f8fa'
      }
    };
  }

  generateGradientDefs(theme) {
    const colors = this.themes[theme];
    return `
      <defs>
        <linearGradient id="gradient-bg-${theme}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.gradientStart};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.gradientEnd};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="accent-gradient-${theme}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${colors.accent};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.accent2};stop-opacity:1" />
        </linearGradient>
        <filter id="glow-${theme}">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="progress-gradient-${theme}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${colors.accent};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors.accent2};stop-opacity:0.8" />
        </linearGradient>
      </defs>
    `;
  }

  generateStatsCard(stats, theme = 'dark', options = {}) {
    const colors = this.themes[theme];
    const width = options.width || 520;
    const height = options.height || 220;
    const period = options.period || 'all';

    const totalContributions = Object.values(stats.contributions).reduce((a, b) => a + b, 0);
    const periodLabel = this.getPeriodLabel(period);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${this.generateGradientDefs(theme)}

        <style>
          .header { font: 700 20px 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.text}; }
          .stat-label { font: 600 12px 'Segoe UI', sans-serif; fill: ${colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-value { font: 700 18px 'Segoe UI', sans-serif; fill: url(#accent-gradient-${theme}); }
          .icon { font-size: 16px; }
          .card-border { stroke: url(#accent-gradient-${theme}); stroke-width: 1.5; }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-in {
            animation: fadeIn 0.6s ease-out forwards;
          }

          .stat-box {
            fill: ${theme === 'dark' ? '#21262d' : '#f6f8fa'};
            rx: 8;
            stroke: ${colors.border};
            stroke-width: 1;
          }
        </style>

        <!-- Main background with gradient -->
        <rect x="1" y="1" rx="12" height="${height-2}" width="${width-2}" fill="${colors.bg}" class="card-border"/>

        <!-- Header section with glow effect -->
        <g transform="translate(30, 35)">
          <text x="0" y="0" class="header animate-in" filter="url(#glow-${theme})">
            ⚡ ${stats.user.name || stats.user.login}'s GitHub Stats${periodLabel}
          </text>
        </g>

        <!-- Stats grid with enhanced boxes -->
        <g transform="translate(30, 70)">
          <!-- Top row -->
          <g transform="translate(0, 0)" class="animate-in">
            <rect class="stat-box" x="0" y="0" width="110" height="50"/>
            <text class="icon" x="10" y="18">⭐</text>
            <text class="stat-value" x="10" y="35">${this.formatNumber(stats.totalStars)}</text>
            <text class="stat-label" x="10" y="45">Total Stars</text>
          </g>

          <g transform="translate(125, 0)" class="animate-in">
            <rect class="stat-box" x="0" y="0" width="110" height="50"/>
            <text class="icon" x="10" y="18">🚀</text>
            <text class="stat-value" x="10" y="35">${this.formatNumber(totalContributions)}</text>
            <text class="stat-label" x="10" y="45">Contributions</text>
          </g>

          <g transform="translate(250, 0)" class="animate-in">
            <rect class="stat-box" x="0" y="0" width="110" height="50"/>
            <text class="icon" x="10" y="18">📁</text>
            <text class="stat-value" x="10" y="35">${stats.totalRepos}</text>
            <text class="stat-label" x="10" y="45">Total Repos</text>
          </g>

          <g transform="translate(375, 0)" class="animate-in">
            <rect class="stat-box" x="0" y="0" width="110" height="50"/>
            <text class="icon" x="10" y="18">🏢</text>
            <text class="stat-value" x="10" y="35">${stats.organizations}</text>
            <text class="stat-label" x="10" y="45">Organizations</text>
          </g>

          <!-- Bottom row -->
          <g transform="translate(0, 65)" class="animate-in">
            <rect class="stat-box" x="0" y="0" width="110" height="50"/>
            <text class="icon" x="10" y="18">📈</text>
            <text class="stat-value" x="10" y="35">${this.formatNumber(stats.contributions.pullRequests)}</text>
            <text class="stat-label" x="10" y="45">Pull Requests</text>
          </g>

          <g transform="translate(125, 65)" class="animate-in">
            <rect class="stat-box" x="0" y="0" width="110" height="50"/>
            <text class="icon" x="10" y="18">🔥</text>
            <text class="stat-value" x="10" y="35">${this.formatNumber(stats.contributions.commits)}</text>
            <text class="stat-label" x="10" y="45">Commits</text>
          </g>

          <g transform="translate(250, 65)" class="animate-in">
            <rect class="stat-box" x="0" y="0" width="110" height="50"/>
            <text class="icon" x="10" y="18">🔒</text>
            <text class="stat-value" x="10" y="35">${stats.privateRepos}</text>
            <text class="stat-label" x="10" y="45">Private Repos</text>
          </g>

          <g transform="translate(375, 65)" class="animate-in">
            <rect class="stat-box" x="0" y="0" width="110" height="50"/>
            <text class="icon" x="10" y="18">👁️</text>
            <text class="stat-value" x="10" y="35">${this.formatNumber(stats.contributions.reviews)}</text>
            <text class="stat-label" x="10" y="45">PR Reviews</text>
          </g>
        </g>

        <!-- Subtle corner accent -->
        <circle cx="${width-30}" cy="30" r="3" fill="url(#accent-gradient-${theme})" opacity="0.6"/>
      </svg>
    `;
  }

  generateLanguageCard(languageStats, theme = 'dark', options = {}) {
    const colors = this.themes[theme];
    const width = options.width || 350;
    const height = options.height || 240;

    const languages = Object.entries(languageStats)
      .sort(([,a], [,b]) => parseFloat(b) - parseFloat(a))
      .slice(0, 6);

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

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${this.generateGradientDefs(theme)}

        <style>
          .header { font: 700 18px 'Segoe UI', sans-serif; fill: ${colors.text}; }
          .lang-name { font: 600 14px 'Segoe UI', sans-serif; fill: ${colors.text}; }
          .lang-percent { font: 700 14px 'Segoe UI', sans-serif; fill: url(#accent-gradient-${theme}); }
          .progress-bg { fill: ${colors.border}; opacity: 0.3; }
          .card-border { stroke: url(#accent-gradient-${theme}); stroke-width: 1.5; }

          @keyframes slideIn {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }

          .animate-slide {
            animation: slideIn 0.8s ease-out forwards;
          }
        </style>

        <rect x="1" y="1" rx="12" height="${height-2}" width="${width-2}" fill="${colors.bg}" class="card-border"/>

        <g transform="translate(25, 35)">
          <text x="0" y="0" class="header" filter="url(#glow-${theme})">🎨 Most Used Languages</text>
        </g>

        <g transform="translate(25, 65)">
          ${languages.map(([lang, percent], index) => {
            const y = index * 30;
            const color = languageColors[lang] || colors.accent;
            const barWidth = (parseFloat(percent) / 100) * 200;

            return `
              <g transform="translate(0, ${y})" class="animate-slide" style="animation-delay: ${index * 0.1}s">
                <!-- Progress bar background -->
                <rect class="progress-bg" x="0" y="8" width="200" height="8" rx="4"/>

                <!-- Progress bar fill -->
                <rect x="0" y="8" width="${barWidth}" height="8" rx="4" fill="${color}" opacity="0.9"/>

                <!-- Language dot -->
                <circle cx="6" cy="12" r="4" fill="${color}" filter="url(#glow-${theme})"/>

                <!-- Language name -->
                <text class="lang-name" x="220" y="16">${lang}</text>

                <!-- Percentage -->
                <text class="lang-percent" x="300" y="16">${percent}%</text>
              </g>
            `;
          }).join('')}
        </g>
      </svg>
    `;
  }

  generateContributionCard(contributions, theme = 'dark', options = {}) {
    const colors = this.themes[theme];
    const width = options.width || 450;
    const height = options.height || 200;
    const period = options.period || 'all';

    const total = Object.values(contributions).reduce((a, b) => a + b, 0);
    const periodLabel = this.getPeriodLabel(period);

    const maxValue = Math.max(...Object.values(contributions));
    const contribData = [
      { label: 'Commits', value: contributions.commits, icon: '🔥', color: '#f59e0b' },
      { label: 'Pull Requests', value: contributions.pullRequests, icon: '📤', color: '#3b82f6' },
      { label: 'Issues', value: contributions.issues, icon: '🐛', color: '#ef4444' },
      { label: 'Reviews', value: contributions.reviews, icon: '👁️', color: '#10b981' }
    ];

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${this.generateGradientDefs(theme)}

        <style>
          .header { font: 700 18px 'Segoe UI', sans-serif; fill: ${colors.text}; }
          .contrib-label { font: 600 12px 'Segoe UI', sans-serif; fill: ${colors.textSecondary}; }
          .contrib-value { font: 700 16px 'Segoe UI', sans-serif; }
          .total-value { font: 700 24px 'Segoe UI', sans-serif; fill: url(#accent-gradient-${theme}); }
          .card-border { stroke: url(#accent-gradient-${theme}); stroke-width: 1.5; }

          @keyframes growBar {
            from { width: 0; }
            to { width: var(--final-width); }
          }

          .progress-bar {
            animation: growBar 1.2s ease-out forwards;
          }
        </style>

        <rect x="1" y="1" rx="12" height="${height-2}" width="${width-2}" fill="${colors.bg}" class="card-border"/>

        <g transform="translate(25, 35)">
          <text x="0" y="0" class="header" filter="url(#glow-${theme})">📊 Contributions${periodLabel}</text>
        </g>

        <!-- Total contributions showcase -->
        <g transform="translate(25, 65)">
          <text class="total-value" x="0" y="0" filter="url(#glow-${theme})">${this.formatNumber(total)} Total</text>
        </g>

        <!-- Contribution bars -->
        <g transform="translate(25, 95)">
          ${contribData.map((item, index) => {
            const y = index * 22;
            const barWidth = maxValue > 0 ? (item.value / maxValue) * 300 : 0;

            return `
              <g transform="translate(0, ${y})">
                <!-- Background bar -->
                <rect x="80" y="2" width="300" height="12" rx="6" fill="${colors.border}" opacity="0.3"/>

                <!-- Progress bar -->
                <rect x="80" y="2" width="0" height="12" rx="6" fill="${item.color}" opacity="0.8" class="progress-bar" style="--final-width: ${barWidth}px"/>

                <!-- Icon and label -->
                <text x="0" y="12" style="font-size: 14px;">${item.icon}</text>
                <text class="contrib-label" x="25" y="12">${item.label}</text>

                <!-- Value -->
                <text class="contrib-value" x="390" y="12" fill="${item.color}">${this.formatNumber(item.value)}</text>
              </g>
            `;
          }).join('')}
        </g>
      </svg>
    `;
  }

  generateTrophyCard(stats, theme = 'dark', options = {}) {
    const colors = this.themes[theme];
    const width = options.width || 550;
    const height = options.height || 280;

    const trophies = this.calculateTrophies(stats);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${this.generateGradientDefs(theme)}

        <style>
          .header { font: 700 20px 'Segoe UI', sans-serif; fill: ${colors.text}; }
          .trophy-title { font: 700 14px 'Segoe UI', sans-serif; fill: ${colors.text}; }
          .trophy-desc { font: 400 11px 'Segoe UI', sans-serif; fill: ${colors.textSecondary}; }
          .trophy-box {
            fill: ${theme === 'dark' ? '#21262d' : '#f6f8fa'};
            stroke: ${colors.border};
            stroke-width: 1.5;
            rx: 10;
          }
          .card-border { stroke: url(#accent-gradient-${theme}); stroke-width: 1.5; }

          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
            60% { transform: translateY(-4px); }
          }

          .trophy-bounce {
            animation: bounce 2s infinite;
          }

          .trophy-glow {
            filter: url(#glow-${theme});
          }
        </style>

        <rect x="1" y="1" rx="12" height="${height-2}" width="${width-2}" fill="${colors.bg}" class="card-border"/>

        <g transform="translate(30, 40)">
          <text x="0" y="0" class="header trophy-glow">🏆 GitHub Achievement Trophies</text>
        </g>

        <g transform="translate(30, 80)">
          ${trophies.map((trophy, index) => {
            const x = (index % 4) * 120;
            const y = Math.floor(index / 4) * 90;

            return `
              <g transform="translate(${x}, ${y})">
                <!-- Trophy box background -->
                <rect class="trophy-box" x="0" y="0" width="110" height="75"/>

                <!-- Trophy icon with bounce animation -->
                <text x="55" y="25" style="font-size: 24px; text-anchor: middle;" class="trophy-bounce" style="animation-delay: ${index * 0.2}s">${trophy.icon}</text>

                <!-- Trophy title -->
                <text class="trophy-title" x="55" y="45" text-anchor="middle">${trophy.title}</text>

                <!-- Trophy description -->
                <text class="trophy-desc" x="55" y="60" text-anchor="middle">${trophy.description}</text>

                <!-- Subtle glow effect -->
                <circle cx="55" cy="15" r="2" fill="url(#accent-gradient-${theme})" opacity="0.4"/>
              </g>
            `;
          }).join('')}
        </g>

        <!-- Achievement count -->
        <g transform="translate(30, ${height - 35})">
          <text style="font: 600 14px 'Segoe UI', sans-serif; fill: url(#accent-gradient-${theme});" class="trophy-glow">
            🎖️ ${trophies.length} Achievements Unlocked
          </text>
        </g>
      </svg>
    `;
  }

  calculateTrophies(stats) {
    const trophies = [];

    // Stars trophies
    if (stats.totalStars >= 1000) trophies.push({ icon: '⭐', title: 'Star Master', description: '1000+ stars' });
    else if (stats.totalStars >= 500) trophies.push({ icon: '🌟', title: 'Star Collector', description: '500+ stars' });
    else if (stats.totalStars >= 100) trophies.push({ icon: '✨', title: 'Rising Star', description: '100+ stars' });
    else if (stats.totalStars >= 10) trophies.push({ icon: '💫', title: 'First Stars', description: '10+ stars' });

    // Repository trophies
    if (stats.totalRepos >= 100) trophies.push({ icon: '📚', title: 'Repo Master', description: '100+ repos' });
    else if (stats.totalRepos >= 50) trophies.push({ icon: '📖', title: 'Prolific', description: '50+ repos' });
    else if (stats.totalRepos >= 20) trophies.push({ icon: '📝', title: 'Creator', description: '20+ repos' });
    else if (stats.totalRepos >= 5) trophies.push({ icon: '📄', title: 'Builder', description: '5+ repos' });

    // Contribution trophies
    const totalContribs = Object.values(stats.contributions).reduce((a, b) => a + b, 0);
    if (totalContribs >= 10000) trophies.push({ icon: '🚀', title: 'Super Active', description: '10k+ contributions' });
    else if (totalContribs >= 5000) trophies.push({ icon: '🔥', title: 'Very Active', description: '5k+ contributions' });
    else if (totalContribs >= 2000) trophies.push({ icon: '💪', title: 'Active', description: '2k+ contributions' });
    else if (totalContribs >= 500) trophies.push({ icon: '⚡', title: 'Contributor', description: '500+ contributions' });

    // Language diversity
    const langCount = Object.keys(stats.languages).length;
    if (langCount >= 10) trophies.push({ icon: '🌈', title: 'Polyglot', description: '10+ languages' });
    else if (langCount >= 7) trophies.push({ icon: '🎨', title: 'Multi-lingual', description: '7+ languages' });
    else if (langCount >= 4) trophies.push({ icon: '🔤', title: 'Diverse Coder', description: '4+ languages' });

    // Organization trophy
    if (stats.organizations >= 5) trophies.push({ icon: '🏢', title: 'Team Player', description: '5+ orgs' });
    else if (stats.organizations >= 2) trophies.push({ icon: '👥', title: 'Collaborator', description: '2+ orgs' });
    else if (stats.organizations >= 1) trophies.push({ icon: '🤝', title: 'Team Member', description: 'In organizations' });

    // Pull Request trophies
    if (stats.contributions.pullRequests >= 1000) trophies.push({ icon: '🔀', title: 'PR Master', description: '1000+ PRs' });
    else if (stats.contributions.pullRequests >= 500) trophies.push({ icon: '📤', title: 'PR Expert', description: '500+ PRs' });
    else if (stats.contributions.pullRequests >= 100) trophies.push({ icon: '📋', title: 'Contributor', description: '100+ PRs' });

    // Special achievements
    if (stats.privateRepos >= 20) trophies.push({ icon: '🔐', title: 'Secret Keeper', description: '20+ private repos' });
    if (stats.contributions.reviews >= 200) trophies.push({ icon: '👁️', title: 'Code Reviewer', description: '200+ reviews' });

    // Limit to 8 trophies for best display
    return trophies.slice(0, 8);
  }

  formatNumber(num) {
    if (num >= 1000000) return Math.floor(num / 1000000) + 'M+';
    if (num >= 1000) return Math.floor(num / 1000) + 'k+';
    return num.toString();
  }

  getPeriodLabel(period) {
    const labels = {
      'all': '',
      'year': ' (This Year)',
      'month': ' (This Month)',
      'last-year': ' (Last Year)',
      'last-month': ' (Last Month)'
    };
    return labels[period] || '';
  }
}

module.exports = SVGGenerator;