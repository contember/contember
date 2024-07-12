import { Project, validateProjectName } from './Project'
import { basename } from 'node:path'
import { Workspace } from './Workspace'
import { getPathFromMapping, listEntriesInMapping, resolvePathMappingConfig } from './PathMapping'
import { pathExists } from './fs'

export class ProjectManager {
	constructor(private readonly workspace: Workspace) {}
	public async listProjects(): Promise<Project[]> {
		const projects = await this.listProjectPaths()
		return await Promise.all(projects.map(it => this.getProject(it)))
	}

	public async getSingleProject(): Promise<Project> {
		if (!this.workspace.isSingleProjectMode()) {
			throw `Please specify a local name project`
		}
		const projects = await this.listProjects()
		if (projects.length !== 1) {
			throw `Please specify a local name project`
		}
		return projects[0]
	}

	public async getProject(name: string | undefined, options: { fuzzy?: boolean } = {}): Promise<Project> {
		if (name === undefined) {
			return await this.getSingleProject()
		}
		validateProjectName(name)
		const projectDir = await this.getDirectory(name)
		if (projectDir && (await pathExists(projectDir))) {
			return new Project(name, projectDir, this.workspace)
		}
		const projects = await this.listProjectPaths()

		if (!options.fuzzy) {
			throw `Project ${name} not found. Known projects: ${projects.join(', ')}`
		}
		const matcher = new RegExp(
			'^' +
				name
					.split('')
					.map(it => it.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&') + '.*')
					.join(''),
		)
		const matched = projects.filter(it => it.match(matcher))
		if (matched.length === 0) {
			throw `Project ${name} not found. Known projects: ${projects.join(', ')}`
		} else if (matched.length > 1) {
			throw `Project name ${name} is ambiguous. Did you mean one of these?\n - ` + matched.join('\n - ') + '\n'
		}
		return this.getProject(matched[0])
	}


	private async getDirectory(name: string) {
		return getPathFromMapping(await this.getProjectPathMapping(), name)
	}

	private async listProjectPaths() {
		const projectMapping = await this.getProjectPathMapping()
		return await listEntriesInMapping(projectMapping)
	}

	private async getProjectPathMapping(): Promise<Record<string, string>> {
		return resolvePathMappingConfig(this.workspace.directory, this.getDefaultProjectName(), this.workspace.config.projects)
	}


	private getDefaultProjectName(): string {
		return this.workspace.env.projectName
			?? basename(this.workspace.directory)
				.toLocaleLowerCase()
				.replace(/[^-_a-z0-9]/, '')
	}
}
