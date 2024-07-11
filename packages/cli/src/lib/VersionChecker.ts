import { join, relative } from 'node:path'
import * as semver from 'semver'
import { PackageWorkspaceResolver } from '@contember/cli-common'
import { DockerComposeManager } from './fs/DockerComposeManager'
import { contemberDockerImages } from '../consts'

export class VersionChecker {
	constructor(
		private readonly version: string,
		private readonly dir: string,
		private readonly packageWorkspaceResolver: PackageWorkspaceResolver,
		private readonly dockerComposeManager: DockerComposeManager,
	) {
	}

	checkVersions = async () => {
		const cliVersion = this.version
		const packageWorkspace = await this.packageWorkspaceResolver.resolve()

		const errors: string[] = []

		for (const packageName of ['@contember/schema', '@contember/schema-definition']) {
			const installedPackages = await packageWorkspace.findInstalledDependencies(packageName)
			for (const pckg of installedPackages) {
				const jsonPath = relative(this.dir, join(pckg.defined.pckg.dir, 'package.json'))

				if (!pckg.installed) {
					errors.push(`Package ${packageName} defined in ${jsonPath} is not installed.`)
					continue
				}
				if (pckg.defined.version !== 'workspace:*' && !semver.satisfies(pckg.installed.version, pckg.defined.version)) {
					errors.push(`Package ${packageName}@${pckg.installed.version} does not match constraint ${pckg.defined.version} defined in ${jsonPath}.`)
					continue
				}
				if (cliVersion !== pckg.installed.version) {
					errors.push(`Package ${packageName}@${pckg.installed.version} does not match version of CLI ${cliVersion}.`)
				}
			}
		}
		const dockerCompose = await this.dockerComposeManager.tryReadMainDockerComposeConfig()

		if (!dockerCompose) {
			errors.push('docker-compose.yaml not found.')
		} else {
			for (const [name, def] of Object.entries(dockerCompose.services ?? {})) {
				if (!def.image) {
					continue
				}
				const [image, version] = def.image.split(':')
				if (!version || !contemberDockerImages.includes(image)) {
					continue
				}
				const versionParts = version.split(/[.-]/)
				if (versionParts[versionParts.length - 1] === 'debian') {
					versionParts.pop()
				}
				const cliVersionParts = cliVersion.split(/[.-]/).slice(0, versionParts.length)
				if (versionParts.join('.') !== cliVersionParts.join('.')) {
					errors.push(`Docker service ${name} with image ${image}:${version} does not match version of CLI ${cliVersion}.`)
				}
			}
		}

		if (errors.length) {
			throw `${errors.map(it => `${it}`).join('\n')}

Please make sure all dependencies are up to date.\nIf you are really certain about the compatibility, you can disable this version check by running the CLI with the CONTEMBER_SKIP_VERSION_CHECK=1 environment variable`
		}
	}

}
