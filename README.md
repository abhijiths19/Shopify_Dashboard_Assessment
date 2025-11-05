# Shopify Dashboard App

This is a Shopify app built with React Router that displays merchant orders in a dashboard interface. The app fetches order data from Shopify and stores it in a MongoDB database for efficient retrieval and display.

## Features

- Displays merchant orders from the last 60 days
- Syncs order data from Shopify to local MongoDB database
- Pagination support for order listings
- Responsive dashboard UI using Shopify Polaris components
- Embedded app support within Shopify admin

## Project Structure

```
my-dashboard-app/
├── app/                    # Frontend React components and routes
│   ├── components/        # Reusable UI components
│   │   └── Dashboard.jsx  # Main dashboard component
│   ├── routes/            # React Router routes
│   │   ├── app.dashboard.jsx  # Dashboard route
│   │   └── api.orders.jsx     # API proxy route
│   └── shopify.server.js  # Shopify authentication setup
├── server/                # Backend Express server
│   ├── models/           # Database models
│   │   └── Order.cjs     # Order Mongoose model
│   ├── routes/           # API routes
│   │   ├── orders.cjs    # Orders API endpoint
│   │   └── sync.cjs      # Manual sync endpoint
│   └── shopifySync.cjs   # Shopify order synchronization
├── prisma/               # Database schema and migrations (SQLite)
└── extensions/           # Shopify app extensions
```

## Prerequisites

1. **Node.js**: [Download and install](https://nodejs.org/en/download/) it if you haven't already.
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup) if you don't have one.
3. **Test Store**: Set up either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or a [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store) for testing your app.
4. **Shopify CLI**: [Download and install](https://shopify.dev/docs/apps/tools/cli/getting-started) it if you haven't already.
```shell
npm install -g @shopify/cli@latest
```

## Setup

```shell
shopify app init --template=https://github.com/Shopify/shopify-app-template-react-router
```

## Local Development

```shell
shopify app dev
```

Press P to open the URL to your app. Once you click install, you can start development.

Local development is powered by [the Shopify CLI](https://shopify.dev/docs/apps/tools/cli). It logs into your partners account, connects to an app, provides environment variables, updates remote config, creates a tunnel and provides commands to generate extensions.

## Configuration

The app requires several environment variables to be set. These are typically configured through the Shopify CLI during development and deployment:

- `SHOPIFY_API_KEY`: Your Shopify app's API key
- `SHOPIFY_API_SECRET`: Your Shopify app's API secret
- `SHOPIFY_APP_URL`: The URL where your app is hosted
- `SCOPES`: Comma-separated list of Shopify API scopes
- `BACKEND_URL`: URL of the backend server (for proxy routes)

For local development, these are automatically managed by the Shopify CLI.

## Database

This app uses two databases:

1. **SQLite**: Managed by Prisma for session storage (in production, you might want to use a more scalable database)
2. **MongoDB**: Used for storing order data fetched from Shopify

The MongoDB connection is configured through the `MONGODB_URI` environment variable.

## API Endpoints

### Frontend Routes

- `/app/dashboard`: Main dashboard displaying orders
- `/api/orders`: Proxy endpoint for orders API
- `/api/sync`: Proxy endpoint for manual sync

### Backend API

- `GET /api/orders`: Retrieve orders with pagination
  - Query parameters:
    - `shop`: Shopify shop domain
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 200, max: 1000)
- `POST /api/sync`: Manually sync orders from Shopify
  - Query parameters:
    - `shop`: Shopify shop domain

## Shopify Authentication

The app uses `@shopify/shopify-app-react-router` for authentication with Shopify. The authentication flow is handled automatically by the Shopify CLI during development.

## Order Synchronization

Orders are synchronized from Shopify to the local MongoDB database. The sync process:

1. Fetches orders from Shopify API (last 60 days)
2. Stores them in the MongoDB database
3. Provides efficient retrieval through the dashboard

Manual synchronization can be triggered through the "Sync from Shopify" button in the dashboard.

## Deployment

### Application Storage

This template uses [Prisma](https://www.prisma.io/) to store session data, by default using an [SQLite](https://www.sqlite.org/index.html) database.
The database is defined as a Prisma schema in `prisma/schema.prisma`.

This use of SQLite works in production if your app runs as a single instance.
The database that works best for you depends on the data your app needs and how it is queried.
Here's a short list of databases providers that provide a free tier to get started:

| Database   | Type             | Hosters                                                                                                                                                                                                                               |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MySQL      | SQL              | [Digital Ocean](https://www.digitalocean.com/products/managed-databases-mysql), [Planet Scale](https://planetscale.com/), [Amazon Aurora](https://aws.amazon.com/rds/aurora/), [Google Cloud SQL](https://cloud.google.com/sql/docs/mysql) |
| PostgreSQL | SQL              | [Digital Ocean](https://www.digitalocean.com/products/managed-databases-postgresql), [Amazon Aurora](https://aws.amazon.com/rds/aurora/), [Google Cloud SQL](https://cloud.google.com/sql/docs/postgres)                                   |
| Redis      | Key-value        | [Digital Ocean](https://www.digitalocean.com/products/managed-databases-redis), [Amazon MemoryDB](https://aws.amazon.com/memorydb/)                                                                                                        |
| MongoDB    | NoSQL / Document | [Digital Ocean](https://www.digitalocean.com/products/managed-databases-mongodb), [MongoDB Atlas](https://www.mongodb.com/atlas/database)                                                                                                  |

To use one of these, you can use a different [datasource provider](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#datasource) in your `schema.prisma` file, or a different [SessionStorage adapter package](https://github.com/Shopify/shopify-api-js/blob/main/packages/shopify-api/docs/guides/session-storage.md).

### Build

Build the app by running the command below with the package manager of your choice:

Using npm:

```shell
npm run build
```

## Hosting

When you're ready to set up your app in production, you can follow [our deployment documentation](https://shopify.dev/docs/apps/deployment/web) to host your app on a cloud provider like [Heroku](https://www.heroku.com/) or [Fly.io](https://fly.io/).

When you reach the step for [setting up environment variables](https://shopify.dev/docs/apps/deployment/web#set-env-vars), you also need to set the variable `NODE_ENV=production`.

## Dependencies

### Frontend Dependencies

- `@shopify/app-bridge-react`: For embedding the app in Shopify admin
- `@shopify/polaris`: Shopify's design system components
- `react-router`: For routing within the app
- `recharts`: For data visualization (if used in charts)

### Backend Dependencies

- `express`: Web framework for the backend API
- `mongoose`: MongoDB object modeling
- `@shopify/shopify-api`: For interacting with Shopify's APIs
- `dotenv`: For loading environment variables

## Troubleshooting

### Database tables don't exist

If you get an error like:

```
The table `main.Session` does not exist in the current database.
```

Create the database for Prisma. Run the `setup` script in `package.json` using `npm`, `yarn` or `pnpm`.

### Navigating/redirecting breaks an embedded app

Embedded apps must maintain the user session, which can be tricky inside an iFrame. To avoid issues:

1. Use `Link` from `react-router` or `@shopify/polaris`. Do not use `<a>`.
2. Use `redirect` returned from `authenticate.admin`. Do not use `redirect` from `react-router`
3. Use `useSubmit` from `react-router`.

This only applies if your app is embedded, which it will be by default.

## Resources

React Router:

- [React Router docs](https://reactrouter.com/home)

Shopify:

- [Intro to Shopify apps](https://shopify.dev/docs/apps/getting-started)
- [Shopify App React Router docs](https://shopify.dev/docs/api/shopify-app-react-router)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Shopify App Bridge](https://shopify.dev/docs/api/app-bridge-library).
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components).
- [App extensions](https://shopify.dev/docs/apps/app-extensions/list)
- [Shopify Functions](https://shopify.dev/docs/api/functions)

Internationalization:

- [Internationalizing your app](https://shopify.dev/docs/apps/best-practices/internationalization/getting-started)
