# 🚀 Automated TestFlight Deployment Setup

## What This Does

This GitHub Actions workflow automatically:
- ✅ Builds your iOS app when you push to `main`
- ✅ Submits directly to TestFlight
- ✅ Skips docs-only changes
- ✅ Allows manual triggering from GitHub

## Setup Instructions

### 1. Get Your Expo Token
```bash
# Run this to get your token
eas login
eas whoami --json
```

### 2. Add Secret to GitHub
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `EXPO_TOKEN`
4. Value: Your token from step 1

### 3. Push This Setup
```bash
git add .github/workflows/testflight-deploy.yml
git commit -m "feat: add automated TestFlight deployment workflow"
git push origin main
```

## How It Works

### Automatic Deployment
- Push any code change to `main` → Auto builds and deploys to TestFlight
- Ignores README/docs changes (won't trigger builds)

### Manual Deployment  
- Go to **GitHub Actions** tab
- Click **Deploy to TestFlight**
- Click **Run workflow**
- Choose production or preview build

## Benefits

✅ **No more manual builds** - Push and forget
✅ **Fast iterations** - Every commit goes to TestFlight
✅ **Team workflow** - Anyone can push, auto-deploys
✅ **Build notifications** - Comments on commits with status

## Monitoring

- Check build progress: [EAS Dashboard](https://expo.dev)
- See workflow runs: GitHub Actions tab
- TestFlight status: App Store Connect

## Cost Considerations

**Expo Build Credits:**
- Free tier: 30 builds/month
- Paid: $29/month for unlimited builds
- Each push to `main` = 1 build credit

**Recommendation**: Start with free tier, upgrade if you push >30 times/month

---

*Want to disable auto-deployment? Just delete the `.github/workflows/testflight-deploy.yml` file*
