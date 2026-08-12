import { describe, expect, test } from 'bun:test'
import { CliError } from '@contember/cli-common'
import {
	DockerComposeAccess,
	PackageUpdateWorkspace,
	PackageUpdateWorkspaceResolver,
	WorkspaceUpdateApiCommand,
} from '../../../src/commands/workspace/WorkspaceUpdateApiCommand.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

const defaultUpdatedDependencies = [
	{ name: '@contember/schema' },
	{ name: '@contember/schema-definition' },
	{ name: '@contember/cli' },
]

const createPackageWorkspace = (
	onWrite: () => void,
	updatedDependencies: readonly { name: string }[] = defaultUpdatedDependencies,
): PackageUpdateWorkspace => ({
	findDefinedDependencies: packageName => [{
		name: packageName,
		version: '2.1.0',
		isDev: false,
		pckg: { dir: '/workspace', isRoot: true },
	}],
	updateEverywhere: async () => {
		onWrite()
		return updatedDependencies
	},
})

describe('WorkspaceUpdateApiCommand', () => {
	test('validates every input before package or docker-compose writes', async () => {
		let packageWrites = 0
		let dockerWrites = 0
		const packageWorkspace = createPackageWorkspace(() => packageWrites++)
		const resolver: PackageUpdateWorkspaceResolver = { resolve: async () => packageWorkspace }
		const dockerCompose: DockerComposeAccess = {
			tryReadMainDockerComposeConfig: async () => ({ services: { engine: 'malformed-service' } }),
			updateMainDockerComposeConfig: async () => {
				dockerWrites++
			},
		}
		const command = new WorkspaceUpdateApiCommand(resolver, dockerCompose)
		const { output } = createTestOutput()

		const promise = command.run(['2.2.0'], output)
		await expect(promise).rejects.toBeInstanceOf(CliError)
		await expect(promise).rejects.toMatchObject({ code: 'INVALID_WORKSPACE_UPDATE' })
		expect(packageWrites).toBe(0)
		expect(dockerWrites).toBe(0)
	})

	test('updates known images and preserves services without images', async () => {
		let packageWrites = 0
		let writtenCompose: unknown
		const packageWorkspace = createPackageWorkspace(() => packageWrites++)
		const resolver: PackageUpdateWorkspaceResolver = { resolve: async () => packageWorkspace }
		const dockerCompose: DockerComposeAccess = {
			tryReadMainDockerComposeConfig: async () => ({
				services: {
					engine: { image: 'contember/engine-ee:2.1.0', environment: { MODE: 'test' } },
					custom: { build: '.' },
				},
			}),
			updateMainDockerComposeConfig: async updater => {
				writtenCompose = updater({})
			},
		}
		const command = new WorkspaceUpdateApiCommand(resolver, dockerCompose)
		const { output, stdout, stderr } = createTestOutput()

		await command.run(['2.2.0'], output)

		expect(packageWrites).toBe(1)
		expect(writtenCompose).toEqual({
			services: {
				engine: { image: 'contember/engine:2.2.0', environment: { MODE: 'test' } },
				custom: { build: '.' },
			},
		})
		expect(stdout.text).toBe('')
		expect(stderr.lines).toStrictEqual([
			'Updating docker-compose',
			'docker-compose service engine updated',
			'API versions updated',
			'Restart server to apply changes',
		])
	})

	test('returns updated package and service names as JSON', async () => {
		const packageWorkspace = createPackageWorkspace(() => {}, [
			{ name: '@contember/schema' },
			{ name: '@contember/schema' },
			{ name: '@contember/cli' },
		])
		const resolver: PackageUpdateWorkspaceResolver = { resolve: async () => packageWorkspace }
		const dockerCompose: DockerComposeAccess = {
			tryReadMainDockerComposeConfig: async () => ({
				services: {
					engine: { image: 'contember/engine:2.1.0' },
					custom: { build: '.' },
				},
			}),
			updateMainDockerComposeConfig: async () => {},
		}
		const { output, stdout, stderr } = createTestOutput()

		await new WorkspaceUpdateApiCommand(resolver, dockerCompose).run(['2.2.0', '--json'], output)

		expect(JSON.parse(stdout.text)).toStrictEqual({
			version: '2.2.0',
			updatedPackages: ['@contember/schema', '@contember/cli'],
			updatedServices: ['engine'],
		})
		expect(stderr.text).toBe('')
	})

	test('returns stable scalar lines in quiet mode', async () => {
		const packageWorkspace = createPackageWorkspace(() => {}, [{ name: '@contember/schema' }])
		const resolver: PackageUpdateWorkspaceResolver = { resolve: async () => packageWorkspace }
		const dockerCompose: DockerComposeAccess = {
			tryReadMainDockerComposeConfig: async () => ({ services: { engine: { image: 'contember/engine:2.1.0' } } }),
			updateMainDockerComposeConfig: async () => {},
		}
		const { output, stdout, stderr } = createTestOutput()

		await new WorkspaceUpdateApiCommand(resolver, dockerCompose).run(['2.2.0', '--quiet'], output)

		expect(stdout.lines).toStrictEqual(['2.2.0', '@contember/schema', 'engine'])
		expect(stderr.text).toBe('')
	})

	test('reports an empty update plan without inventing changed names', async () => {
		const packageWorkspace = createPackageWorkspace(() => {}, [])
		const resolver: PackageUpdateWorkspaceResolver = { resolve: async () => packageWorkspace }
		const dockerCompose: DockerComposeAccess = {
			tryReadMainDockerComposeConfig: async () => ({ services: { custom: { build: '.' } } }),
			updateMainDockerComposeConfig: async () => {},
		}
		const { output, stdout } = createTestOutput()

		await new WorkspaceUpdateApiCommand(resolver, dockerCompose).run(['2.2.0', '--json'], output)

		expect(JSON.parse(stdout.text)).toStrictEqual({
			version: '2.2.0',
			updatedPackages: [],
			updatedServices: [],
		})
	})
})
