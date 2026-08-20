import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { DockerComposeConfig } from '../../lib/fs/DockerComposeManager.js'
import { contemberDockerImages } from '../../consts.js'

type Args = {
	version: string
}

type Options = {}

export interface PackageUpdateWorkspace {
	findDefinedDependencies(packageName: string): unknown
	updateEverywhere(updates: Record<string, string>): Promise<readonly { name: string }[]>
}

export interface PackageUpdateWorkspaceResolver {
	resolve(): Promise<PackageUpdateWorkspace>
}

export interface DockerComposeAccess {
	tryReadMainDockerComposeConfig(): Promise<unknown>
	updateMainDockerComposeConfig(updater: (data: Partial<DockerComposeConfig>) => DockerComposeConfig): Promise<void>
}

export interface WorkspaceApiUpdatePlan {
	compose: DockerComposeConfig
	updatedServices: string[]
}

export interface WorkspaceApiUpdateResult {
	version: string
	updatedPackages: string[]
	updatedServices: string[]
}

type DockerComposeServiceRecord = Record<string, unknown> & { image?: string }
type DockerComposeDocument = Record<string, unknown> & { services?: Record<string, DockerComposeServiceRecord> }

export class WorkspaceUpdateApiCommand extends Command<Args, Options> {
	constructor(
		private readonly packageWorkspaceResolver: PackageUpdateWorkspaceResolver,
		private readonly dockerComposeManager: DockerComposeAccess,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Updates Contember API version and all related packages')
		configuration.argument('version')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const version = input.getArgument('version')
		const packageWorkspace = await this.packageWorkspaceResolver.resolve()
		const packageUpdates = {
			'@contember/schema': version,
			'@contember/schema-definition': version,
			'@contember/cli': version,
		}

		validatePackageUpdatePlan(packageWorkspace, packageUpdates)
		const composePlan = createWorkspaceApiUpdatePlan(
			await this.dockerComposeManager.tryReadMainDockerComposeConfig(),
			version,
		)

		const updatedDependencies = await packageWorkspace.updateEverywhere(packageUpdates)
		const updatedPackages = [...new Set(updatedDependencies.map(dependency => dependency.name))]

		output.info('Updating docker-compose')
		await this.dockerComposeManager.updateMainDockerComposeConfig(() => composePlan.compose)
		for (const name of composePlan.updatedServices) {
			output.info(`docker-compose service ${name} updated`)
		}
		output.info('API versions updated')
		output.info('Restart server to apply changes')
		writeMachineResult(output, { version, updatedPackages, updatedServices: composePlan.updatedServices })
	}
}

const writeMachineResult = (output: Output, result: WorkspaceApiUpdateResult): void => {
	if (output.mode !== 'human') {
		output.data(result, {
			quiet: value => [value.version, ...value.updatedPackages, ...value.updatedServices],
		})
	}
}

export const createWorkspaceApiUpdatePlan = (input: unknown, version: string): WorkspaceApiUpdatePlan => {
	if (version.length === 0) {
		throw invalidWorkspaceUpdate('Version must not be empty', 'version')
	}
	if (input !== null && input !== undefined && !isDockerComposeConfig(input)) {
		throw invalidWorkspaceUpdate('docker-compose configuration is malformed', 'docker-compose')
	}

	const config = input ?? {}
	const services: Record<string, DockerComposeServiceRecord> = {}
	const updatedServices: string[] = []
	for (const [name, service] of Object.entries(config.services ?? {})) {
		const image = service.image === undefined ? null : getNewImage(service.image, version)
		if (image === null) {
			services[name] = service
			continue
		}
		services[name] = { ...service, image }
		updatedServices.push(name)
	}
	return { compose: { ...config, services }, updatedServices }
}

const validatePackageUpdatePlan = (workspace: PackageUpdateWorkspace, updates: Record<string, string>): void => {
	for (const [packageName, version] of Object.entries(updates)) {
		if (packageName.length === 0 || version.length === 0) {
			throw invalidWorkspaceUpdate('Package update is malformed', packageName || 'package')
		}
		const dependencies = workspace.findDefinedDependencies(packageName)
		if (!Array.isArray(dependencies) || !dependencies.every(value => isPlannedDependency(value, packageName))) {
			throw invalidWorkspaceUpdate(`Package metadata for ${packageName} is malformed`, packageName)
		}
	}
}

const isPlannedDependency = (value: unknown, packageName: string): boolean => {
	if (!isRecord(value) || typeof value.name !== 'string' || typeof value.version !== 'string' || typeof value.isDev !== 'boolean') {
		return false
	}
	return value.name === packageName
		&& value.version.length > 0
		&& isRecord(value.pckg)
		&& typeof value.pckg.dir === 'string'
		&& typeof value.pckg.isRoot === 'boolean'
}

const isDockerComposeConfig = (value: unknown): value is DockerComposeDocument => {
	if (!isRecord(value)) {
		return false
	}
	if (value.services === undefined) {
		return true
	}
	return isRecord(value.services) && Object.values(value.services).every(isDockerComposeServiceRecord)
}

const isDockerComposeServiceRecord = (value: unknown): value is DockerComposeServiceRecord =>
	isRecord(value) && (value.image === undefined || typeof value.image === 'string')

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const getNewImage = (currentImage: string, version: string): string | null => {
	for (const candidate of contemberDockerImages) {
		if (currentImage.startsWith(`${candidate}:`)) {
			return `${candidate.replace(/-ee$/, '')}:${version}`
		}
	}
	return null
}

const invalidWorkspaceUpdate = (message: string, source: string): CliError =>
	new CliError(message, {
		code: 'INVALID_WORKSPACE_UPDATE',
		exitCode: ExitCode.InputError,
		details: { source },
	})
