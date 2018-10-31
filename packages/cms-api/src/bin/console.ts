#!/usr/bin/env node

import Application from '../cli/Application'
import ProjectMigrationsDiffCommand from '../cli/ProjectMigrationsDiffCommand'
import EngineMigrationsContinueCommand from '../cli/EngineMigrationsContinueCommand'
import EngineMigrationsCreateCommand from '../cli/EngineMigrationsCreateCommand'
import InitCommand from '../cli/InitCommand'
import DropCommand from '../cli/DropCommand'

const application = new Application([
	new EngineMigrationsCreateCommand(),
	new ProjectMigrationsDiffCommand(),
	new EngineMigrationsContinueCommand(),
	new InitCommand(),
	new DropCommand(),
])
application.run(process.argv)
