# Contributing Contember engine

We're glad you're interested in contributing. Here's a guide to help you get started.

## Prerequisites:

- A GitHub account
- Git installed on your computer
- Node.js and Yarn installed
- Docker and Docker Compose installed
- A code editor of your choice (e.g. Visual Studio Code or WebStorm)

## Getting Started:

- Fork and Clone the Contember Engine repository on GitHub (e.g. `git clone git@github.com:contember/engine.git contember-engine`, or an URI of your fork)
- Enter the repository directory (`cd contember-engine`)
- Install all dependencies by running `yarn install`
- Create a `docker-compose.override.yaml` file using `docker-compose.override.dist.yaml` as a template
- Start the TypeScript watch process by running `docker-compose up ts_watch` in a terminal window
- To run tests, start the container using `docker-compose run api bash` and navigate to a specific package (e.g. `packages/engine-content-api`). Then run tests using `yarn run test`, or with the path to a specific test file.
- To run the engine locally, simply run `docker-compose up api`.

## Making Contributions:
- Contributions are welcome to all open-source parts of Contember, except for the `/ee/` folder.
- Create a new branch for your changes (e.g. `git checkout -b my-changes`)
- Make your changes and be sure all tests and lints are passing.
- Commit your changes with a meaningful message, we try to follow "Conventional Commits" (e.g. `git commit -m "fix(content-api): handle null in orderBy"`). Check the git log, if you are not sure.
- Push the branch to your fork (`git push origin my-changes`)
- Create a pull request on GitHub, explaining your changes and referencing any relevant issues.
- We want to make sure that everyone who contributes to Contember feels valued and supported. If you have any questions, feel free to reach us in [Github Discussions](https://github.com/orgs/contember/discussions). Happy coding!
