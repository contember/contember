import * as path from 'path'
import { Workspace } from './Workspace'

export class Project {
	constructor(
		public readonly name: string,
		private readonly directory: string,
		private readonly workspace: Workspace,
	) {}

	get adminDir() {
		return path.join(this.directory, 'admin')
	}

	get apiDir() {
		return path.join(this.directory, 'api')
	}

	get migrationsDir() {
		return path.join(this.apiDir, 'migrations')
	}
}

export const validateProjectName = (name: string) => {
	if (!name.match(/^[a-z][-a-z0-9]*$/i)) {
		throw 'Invalid project name. It can contain only alphanumeric characters, dash and must start with a letter'
	}
}
