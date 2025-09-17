# 🚀 GitHub Stats for Nerds

A comprehensive GitHub stats generator that includes **private repositories** and **organization contributions** - not just public repos!

## ✨ Features

- 📊 **Comprehensive Stats**: Total commits, PRs, issues, and reviews (including private/org)
- 🏢 **Organization Data**: See your contributions across all organizations
- 🔒 **Private Repository Stats**: Include your private repo contributions
- 🎨 **Multiple Themes**: Dark and light themes available
- 📈 **Language Analytics**: Real language distribution across all your repos
- ⚡ **Serverless**: Fast, scalable Vercel deployment

## 🚀 Quick Start

### 1. Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read org membership)
   - ✅ `read:user` (Read user profile data)
   - ✅ `user:email` (Access user email addresses)

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/github-stats-for-nerds&env=GITHUB_TOKEN&envDescription=GitHub%20Personal%20Access%20Token%20with%20repo%20and%20read:org%20scopes)

Or manually:

```bash
# Clone the repository
git clone https://github.com/yourusername/github-stats-for-nerds
cd github-stats-for-nerds

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GitHub token

# Deploy to Vercel
npx vercel --prod
```

### 3. Add to Your Profile README

Replace `your-deployed-url.vercel.app` with your actual Vercel deployment URL:

```markdown
## 📊 GitHub Stats

<!-- Main Stats Card -->
![GitHub Stats](https://your-deployed-url.vercel.app/api/stats?username=yashChouriya&theme=dark)

<!-- Languages Card -->
![Top Languages](https://your-deployed-url.vercel.app/api/stats?username=yashChouriya&card=languages&theme=dark)

<!-- Contributions Card -->
![Contributions](https://your-deployed-url.vercel.app/api/stats?username=yashChouriya&card=contributions&theme=dark)
```

## 🎛️ API Parameters

### `/api/stats`

| Parameter | Description | Default | Options |
|-----------|-------------|---------|---------|
| `username` | GitHub username | **Required** | Any valid GitHub username |
| `theme` | Color theme | `dark` | `dark`, `light` |
| `card` | Card type | `stats` | `stats`, `languages`, `contributions` |
| `include_private` | Include private repos | `true` | `true`, `false` |

### Examples

```
# Main stats with dark theme
/api/stats?username=yashChouriya&theme=dark

# Languages card with light theme
/api/stats?username=yashChouriya&card=languages&theme=light

# Contributions card
/api/stats?username=yashChouriya&card=contributions

# Public repos only
/api/stats?username=yashChouriya&include_private=false
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GitHub token to .env

# Start development server
npm run dev

# Visit: http://localhost:3000/api/stats?username=yashChouriya
```

## 📝 Environment Variables

Create a `.env` file:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🎨 Available Cards

### 1. Stats Card (Default)
Shows comprehensive GitHub statistics including private repos and organizations.

### 2. Languages Card
Displays your top programming languages with accurate percentages from all repositories.

### 3. Contributions Card
Shows your yearly contributions: commits, PRs, issues, and reviews.

## 🔒 Privacy & Security

- **Your token is secure**: Stored as environment variables, never exposed
- **No data storage**: We don't store any of your GitHub data
- **Cached responses**: Results cached for 30 minutes for performance
- **Rate limiting**: Built-in protection against API abuse

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for developers who want to show their **complete** GitHub story.