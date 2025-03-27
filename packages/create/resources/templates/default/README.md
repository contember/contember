# My awesome multilingual CMS

Welcome to your new project created with [Contember AI Studio](https://www.contember.com/studio)! If you need
assistance, feel free to join the conversation in
our [GitHub Discussions](https://github.com/orgs/contember/discussions/categories/support).

## Getting Started

Before you begin, ensure you have:

- [Yarn](https://yarnpkg.com/getting-started/install) installed
- [Docker](https://docs.docker.com/get-docker/) installed and running

### Project Overview

Your project consists of the following packages:

#### [@app/admin](./admin)

- **Location:** `./admin`
- **Description:** A React SPA that serves as the administration UI, built with Contember DataBinding for seamless integration with the Contember API.
- **Sentry:** [Sentry](https://sentry.io) is integrated into the project. To enable Sentry, set the `VITE_SENTRY_DSN` environment variable in the `.env.production` file.

#### [@app/api](./api)

- **Location:** `./api`
- **Description:** Defines the data model and permissions for the Contember API.

#### [@app/client](./client)

- **Location:** `./client`
- **Description:** A type-safe GraphQL client for interacting with the Contember API, complete with generated types.
- **Documentation:** [Client Documentation](./client/README.md)

#### [@app/worker](./worker)

- **Location:** `./worker`
- **Description:** A serverless function deployed to Cloudflare Workers for executing server-side operations.
- **Documentation:** [Worker Documentation](./worker/README.md)

- - -

## Running the Project Locally

Follow these steps to set up and run your project locally:

1. **Install Dependencies**

   Run the following command to install all required dependencies:
   ```bash
   {packageManager} install
   ```

2. **Start the Project**

   Start the admin application and all necessary services with:
   ```bash
   {packageManager} run start
   ```

   This will launch the following components:

| Container        | Port | Url                                            |
|------------------|------|------------------------------------------------|
| Contember Engine | 1481 | [http://localhost:1481](http://localhost:1481) |
| Postgres         | 1482 | [http://localhost:1482](http://localhost:1482) |
| S3               | 1483 | [http://localhost:1483](http://localhost:1483) |
| MailPit          | 1484 | [http://localhost:1484](http://localhost:1484) |
| Adminer          | 1485 | [http://localhost:1485](http://localhost:1485) |
| S3 Dashboard     | 1486 | [http://localhost:1486](http://localhost:1486) |

When you're done, stop the Docker containers with:

```bash
docker compose down
```

- - -

## Next Steps

Congratulations, your project is now running locally! Access the administration UI
at [http://localhost:1480](http://localhost:1480/).

Enjoy building with Contember!

- - -

## Update headless UI components

To update the headless UI components, run the following command:

```bash
sh ./scripts/update-ui-lib.sh
```

This will update `lib` folder in the `@app/admin` package with the latest headless UI components. If you have made any
changes to the components, make sure to commit them before running this command.
