import { Project, validateProjectName } from './Project'
import { join } from 'path'
import { Workspace } from './Workspace'
import { resourcesDir } from '../pathUtils'
import { installTemplate } from './template'
import { pathExists } from 'fs-extra'
import { getPathFromMapping, listEntriesInMapping, resolvePathMappingConfig } from './PathMapping'

export class ProjectManager {
	constructor(private readonly workspace: Workspace) {}
	public async listProjects(): Promise<Project[]> {
		const projects = await this.listProjectPaths()
		return await Promise.all(projects.map(it => this.getProject(it)))
	}

	public async getProject(name: string, options: { fuzzy?: boolean } = {}): Promise<Project> {
		validateProjectName(name)
		let projectDir = await this.getDirectory(name)
		if (!(await pathExists(projectDir))) {
			if (!options.fuzzy) {
				throw `Project ${name} not found.`
			}
			const projects = await this.listProjectPaths()
			const matcher = new RegExp(
				'^' +
					name
						.split('')
						.map(it => it.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&') + '.*')
						.join(''),
			)
			const matched = projects.filter(it => it.match(matcher))
			if (matched.length === 0) {
				throw `Project ${name} not found.`
			} else if (matched.length > 1) {
				throw `Project name ${name} is ambiguous. Did you mean one of these?\n - ` + matched.join('\n - ') + '\n'
			}
			return this.getProject(matched[0])
		}
		return new Project(name, projectDir, this.workspace)
	}

	public async createProject(name: string, args: { template?: string }): Promise<Project> {
		validateProjectName(name)
		const projectDir = await this.getDirectory(name)
		const withAdmin = this.workspace.adminEnabled
		const template =
			args.template ||
			(withAdmin ? '@contember/template-project-with-admin' : join(resourcesDir, 'templates/template-project'))
		await installTemplate(template, projectDir, 'project', { projectName: name })
		return new Project(name, projectDir, this.workspace)
	}

	private async getDirectory(name: string) {
		return getPathFromMapping(await this.getProjectPathMapping(), name)
	}

	private async listProjectPaths() {
		const projectMapping = await this.getProjectPathMapping()
		return await listEntriesInMapping(projectMapping)
	}

	private async getProjectPathMapping(): Promise<Record<string, string>> {
		return resolvePathMappingConfig(this.workspace.directory, this.workspace.config.projects)
	}
}
