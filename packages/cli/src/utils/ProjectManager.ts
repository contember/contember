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
		const projectMapping = await this.getProjectPathMapping()
		const projects = await listEntriesInMapping(projectMapping)
		return await Promise.all(projects.map(it => this.getProject(it)))
	}

	public async getProject(name: string): Promise<Project> {
		validateProjectName(name)
		const projectDir = await this.getDirectory(name)
		await this.verifyProjectExists(projectDir, name)
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

	private async getProjectPathMapping(): Promise<Record<string, string>> {
		return resolvePathMappingConfig(this.workspace.directory, 'projects', this.workspace.config.projects)
	}

	private async verifyProjectExists(dir: string, name: string) {
		if (!(await pathExists(dir))) {
			throw `Project ${name} not found.`
		}
	}
}
