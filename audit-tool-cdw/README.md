# Forge Hello World

This project contains a Forge app written in Javascript that displays `Hello World!` in a Jira project page. 

See [developer.atlassian.com/platform/forge/](https://developer.atlassian.com/platform/forge) for documentation and tutorials explaining Forge.

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Quick start
- Install dependecies (inside root directory)
```
npm install
```
- Install dependencies (inside of the `static/hello-world` directory)::
```
npm install
```

- Modify your app by editing the files in `static/hello-world/src/`.

- Build your app (inside of the `static/hello-world` directory):
```
npm run build
```

- Deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

## Jira API Migration (CHANGE-2046)

Atlassian removed the legacy Jira search API and introduced the enhanced search endpoint. This app has been updated accordingly.

- Updated endpoint: `POST /rest/api/3/search` ➜ `POST /rest/api/3/search/jql`
- Pagination changes: `startAt`/`total` ➜ `nextPageToken`
- Request body still accepts `jql`, `maxResults`, and `fields`

Relevant code updates were applied in `src/index.js`:

- Resolvers `searchCDROpenRemediation` and `searchCDIOpenIngestion` now call `POST /rest/api/3/search/jql`
- Pagination logic loops using `nextPageToken` until it is no longer returned
- Reference: https://developer.atlassian.com/changelog/#CHANGE-2046

### Test the migration

1. Build the static assets (inside `static/hello-world/`):
   ```
   npm run build
   ```
2. Deploy the Forge app from the repo root:
   ```
   forge deploy
   ```
3. Open the project page and use the UI to fetch issues.
   - You should no longer see 410 responses like: `The requested API has been removed...`
   - Results should load across multiple pages via the new `nextPageToken` mechanism.

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.

