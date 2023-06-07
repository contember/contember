import { getPackageVersion, Workspace } from '@contember/cli-common'
import { join, relative } from 'node:path'
import * as semver from 'semver'
import { contemberDockerImages, tryReadMainDockerComposeConfig } from './dockerCompose'

export const checkVersions = async (workspace: Workspace) => {
	const cliVersion = getPackageVersion()
	const packageWorkspace = await workspace.resolvePackageWorkspace()
	const errors: string[] = []

	for (const packageName of ['@contember/schema', '@contember/schema-definition']) {
		const installedPackages = await packageWorkspace.findInstalledDependencies(packageName)
		for (const pckg of installedPackages) {
			const jsonPath = relative(workspace.directory, join(pckg.defined.pckg.dir, 'package.json'))

			if (!pckg.installed) {
				errors.push(`Package ${packageName} defined in ${jsonPath} is not installed.`)
				continue
			}
			if (!semver.satisfies(pckg.installed.version, pckg.defined.version)) {
				errors.push(`Package ${packageName}@${pckg.installed.version} does not match constraint ${pckg.defined.version} defined in ${jsonPath}.`)
				continue
			}
			if (cliVersion !== pckg.installed.version) {
				errors.push(`Package ${packageName}@${pckg.installed.version} does not match version of CLI ${cliVersion}.`)
			}
		}
	}
	const dockerCompose = await tryReadMainDockerComposeConfig(workspace.directory)

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
