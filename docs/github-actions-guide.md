# GitHub Actions Quick Start Guide

This guide shows you how to use the automated data collection workflow.

## 🚀 Running the Scraper via GitHub Actions

### Step 1: Navigate to Actions

1. Go to your repository on GitHub
2. Click the **"Actions"** tab at the top
3. You'll see a list of workflows on the left sidebar

### Step 2: Select the Workflow

1. Click **"Update Restaurant Inspection Data"** from the workflow list
2. You'll see the workflow's run history

### Step 3: Trigger a New Run

1. Click the **"Run workflow"** dropdown button (top right)
2. Configure your options:

   ```
   ┌─────────────────────────────────────────┐
   │ Run workflow                            │
   ├─────────────────────────────────────────┤
   │ Use workflow from: Branch: main      ▼  │
   │                                          │
   │ Which county to scrape                   │
   │ ┌─────────────────────────────────────┐ │
   │ │ all                              ▼  │ │
   │ └─────────────────────────────────────┘ │
   │                                          │
   │ Merge with existing data                 │
   │ ☑ true                                   │
   │                                          │
   │        [Run workflow]                    │
   └─────────────────────────────────────────┘
   ```

3. Click the green **"Run workflow"** button

### Step 4: Monitor Progress

1. The workflow will appear at the top of the runs list
2. Click on it to see real-time logs
3. Watch each step complete with ✅ or ❌

### Step 5: View Results

After completion, you'll see:

#### ✅ Success Summary

```
🍽️ Restaurant Inspection Data Update
═══════════════════════════════════════

✅ Status: Success

Configuration
• County: all
• Merge Mode: true
• Triggered By: @yourusername
• Timestamp: 2025-11-07 14:30:00 UTC

Statistics
┌──────────┬────────────────────┐
│ Metric   │ Value              │
├──────────┼────────────────────┤
│ Before   │ 12 restaurants     │
│ After    │ 125 restaurants    │
│ Change   │ +113               │
└──────────┴────────────────────┘

🎉 Changes committed and pushed!
```

#### 📦 Download Logs

1. Scroll to the bottom of the workflow run page
2. Find the **"Artifacts"** section
3. Download `scraper-logs-[run-number]`
4. Logs are kept for 30 days

#### 📝 Check Commit

1. Go to your repository's main page
2. Look for the latest commit:
   ```
   chore: update inspection data for all county

   - Total restaurants: 125
   - Change: +113 restaurants
   - Updated: 2025-11-07 14:30:00 UTC
   ```

## 🔧 Configuration Options

### County Selection

| Option | Description |
|--------|-------------|
| `all` | Scrape both Summit and Cuyahoga counties |
| `summit` | Scrape only Summit County |
| `cuyahoga` | Scrape only Cuyahoga County |

**Recommendation**: Start with a single county to test, then use `all` for full updates.

### Merge Mode

| Setting | Behavior |
|---------|----------|
| ✅ Enabled (recommended) | Adds new data while keeping existing restaurants. Updates inspections for existing restaurants. |
| ❌ Disabled | Replaces entire dataset with newly scraped data. |

**Recommendation**: Keep enabled to preserve historical data.

## 🔄 Scheduled Automatic Updates

To run the scraper automatically on a schedule:

### Edit the Workflow File

1. Go to `.github/workflows/update-data.yml`
2. Find this section:

   ```yaml
   # Optional: Schedule automatic updates (uncomment to enable)
   # schedule:
   #   - cron: '0 2 * * 0'  # Run every Sunday at 2 AM UTC
   ```

3. Remove the `#` to uncomment:

   ```yaml
   # Optional: Schedule automatic updates
   schedule:
     - cron: '0 2 * * 0'  # Run every Sunday at 2 AM UTC
   ```

### Common Schedules

```yaml
# Every Sunday at 2 AM UTC
- cron: '0 2 * * 0'

# Every day at 3 AM UTC
- cron: '0 3 * * *'

# First day of every month at 1 AM UTC
- cron: '0 1 1 * *'

# Every Monday and Thursday at 4 AM UTC
- cron: '0 4 * * 1,4'
```

**Tip**: Use [crontab.guru](https://crontab.guru/) to create custom schedules.

## ❌ Error Handling

### Automatic Issue Creation

If the scraper fails, an issue is automatically created:

```
Title: [Scraper Failed] all county data update failed

🚨 Scraper Failure Report

County: all
Run: #42
Triggered by: @yourusername
Timestamp: 2025-11-07T14:30:00.000Z

Details
The restaurant inspection data scraper failed during execution.
Please review the workflow logs for details.

Next Steps
1. Check the workflow run logs for error messages
2. Review the scraper logs artifact
3. Verify data source availability
4. Check for API rate limits or access issues

Labels: bug, scraper, automation
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid JSON` | Scraper produced malformed JSON | Check scraper output format |
| `Missing 'restaurants' field` | Schema mismatch | Verify scraper follows schema |
| `HTTP 429` | Rate limit exceeded | Reduce frequency or add delays |
| `Connection timeout` | Network/site issues | Retry later or check site status |
| `Exit code 1` | Python error | Check logs for stack trace |

## 📊 Monitoring

### View All Runs

Actions tab → "Update Restaurant Inspection Data" → See run history with:
- ✅ Successful runs (green checkmark)
- ❌ Failed runs (red X)
- ⏳ In-progress runs (yellow dot)

### Email Notifications

GitHub automatically emails you when:
- A workflow you triggered fails
- A scheduled workflow fails

Configure in: **Settings** → **Notifications** → **Actions**

## 🔒 Permissions

The workflow requires these permissions:
- ✅ `contents: write` - To commit and push data changes
- ✅ `issues: write` - To create issues on failure

These are granted automatically by the workflow configuration.

## 💡 Best Practices

1. **Test First**: Run manually with one county before enabling scheduled runs
2. **Monitor Logs**: Check logs after first few runs to catch issues early
3. **Use Merge Mode**: Preserve historical data by keeping merge enabled
4. **Review Issues**: Check auto-created issues and fix problems promptly
5. **Validate Data**: Spot-check the JSON after major scraper changes
6. **Rate Limiting**: Add delays in scraper to respect source websites
7. **Schedule Wisely**: Choose off-peak hours (2-4 AM) for scheduled runs

## 📞 Troubleshooting

### Workflow Not Visible

- Make sure `.github/workflows/update-data.yml` is committed to your repository
- Check that Actions are enabled: **Settings** → **Actions** → **General**

### Can't Trigger Manually

- Ensure you have write access to the repository
- Check that your branch has the workflow file

### Changes Not Appearing

- Verify the workflow completed successfully
- Check that `data/inspections.json` was modified
- Look for the commit in your repository history
- Pull the latest changes: `git pull`

### Need Help?

1. Check the [main README](../README.md) for detailed documentation
2. Review the workflow logs for specific errors
3. Open an issue in the repository
4. Check if similar issues exist (search issues with `label:scraper`)

---

**Last Updated**: November 2025
