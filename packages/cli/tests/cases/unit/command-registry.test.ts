import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Command } from '@contember/cli-common'
import * as tenantCommands from '../../../src/commands/tenant/index.js'
import { createContainer } from '../../../src/dic.js'
import { Workspace } from '../../../src/lib/workspace/Workspace.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

/**
 * The gate over `dic.ts`. Everything here is derived from the real container, so a command that is
 * implemented but never registered — or registered with a broken wiring — fails here and nowhere else.
 */
const workspaceDir = '/nonexistent-workspace'
const workspace: Workspace = {
	baseDir: workspaceDir,
	apiDir: join(workspaceDir, 'api'),
	migrationsDir: join(workspaceDir, 'api/migrations'),
}

const createTestContainer = () => {
	const { output, stdout, stderr } = createTestOutput()
	const dic = createContainer({ env: {}, version: '0.0.0-test', runtime: 'node', workspace, output })
	return { dic, stdout, stderr }
}

/** Normalizes a registered key the way `CommandManager` does — the colon form and the space form are one name. */
const normalize = (name: string): string => name.split(/[\s:]+/).filter(it => it !== '').join(' ')

const tenantCommandDir = join(import.meta.dir, '../../../src/commands/tenant')

const tenantSourceFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const path = join(dir, entry.name)
		return entry.isDirectory() ? tenantSourceFiles(path) : entry.name.endsWith('.ts') ? [path] : []
	})

interface ExpectedCommand {
	readonly name: string
	readonly aliases: readonly string[]
}

/** Public command names and aliases are an explicit compatibility contract, independent of `dic.ts`. */
const expectedCommandCatalog: readonly ExpectedCommand[] = [
	{ name: 'deploy', aliases: [] },
	{ name: 'version', aliases: [] },
	{ name: 'commands', aliases: [] },
	{ name: 'data export', aliases: ['data:export'] },
	{ name: 'data import', aliases: ['data:import'] },
	{ name: 'data transfer', aliases: ['data:transfer'] },
	{ name: 'migrations diff', aliases: ['migrations:diff'] },
	{ name: 'migrations amend', aliases: ['migrations:amend'] },
	{ name: 'migrations blank', aliases: ['migrations:blank'] },
	{ name: 'migrations init-state', aliases: ['migrations:init-state'] },
	{ name: 'migrations describe', aliases: ['migrations:describe'] },
	{ name: 'migrations execute', aliases: ['migrations:execute'] },
	{ name: 'migrations rebase', aliases: ['migrations:rebase'] },
	{ name: 'migrations snapshot', aliases: ['migrations:snapshot'] },
	{ name: 'migrations verify-snapshot', aliases: ['migrations:verify-snapshot'] },
	{ name: 'migrations status', aliases: ['migrations:status'] },
	{ name: 'workspace update api', aliases: ['workspace:update:api'] },
	{ name: 'project validate', aliases: ['project:validate'] },
	{ name: 'project print-schema', aliases: ['project:print-schema'] },
	{ name: 'project generate-doc', aliases: ['project:generate-doc'] },
	{ name: 'actions list-variables', aliases: ['actions:list-variables'] },
	{ name: 'actions set-variables', aliases: ['actions:set-variables'] },
	{ name: 'actions failed-events', aliases: ['actions:failed-events'] },
	{ name: 'actions retry-event', aliases: ['actions:retry-event'] },
	{ name: 'actions get-event', aliases: ['actions:get-event'] },
	{ name: 'actions stop-event', aliases: ['actions:stop-event'] },
	{ name: 'tenant apply', aliases: ['tenant:apply'] },
	{ name: 'tenant whoami', aliases: ['tenant:whoami'] },
	{ name: 'tenant auth-log', aliases: ['tenant:auth-log'] },
	{ name: 'tenant config show', aliases: ['tenant:config:show'] },
	{ name: 'tenant idp list', aliases: ['tenant:idp:list'] },
	{ name: 'tenant project list', aliases: ['tenant:project:list'] },
	{ name: 'tenant project show', aliases: ['tenant:project:show'] },
	{ name: 'tenant project create', aliases: ['tenant:project:create'] },
	{ name: 'tenant project update', aliases: ['tenant:project:update'] },
	{ name: 'tenant project secret set', aliases: ['tenant:project:secret:set'] },
	{ name: 'tenant person list', aliases: ['tenant:person:list'] },
	{ name: 'tenant person show', aliases: ['tenant:person:show'] },
	{ name: 'tenant person create', aliases: ['tenant:person:create'] },
	{ name: 'tenant person update', aliases: ['tenant:person:update'] },
	{ name: 'tenant person set-password', aliases: ['tenant:person:set-password'] },
	{ name: 'tenant person disable', aliases: ['tenant:person:disable'] },
	{ name: 'tenant person sign-out', aliases: ['tenant:person:sign-out'] },
	{ name: 'tenant person reset-mfa', aliases: ['tenant:person:reset-mfa'] },
	{ name: 'tenant person reset-password-request', aliases: ['tenant:person:reset-password-request'] },
	{ name: 'tenant session create', aliases: ['tenant:session:create'] },
	{ name: 'tenant identity role add', aliases: ['tenant:identity:role:add'] },
	{ name: 'tenant identity role remove', aliases: ['tenant:identity:role:remove'] },
	{ name: 'tenant member list', aliases: ['tenant:member:list'] },
	{ name: 'tenant member add', aliases: ['tenant:member:add'] },
	{ name: 'tenant member update', aliases: ['tenant:member:update'] },
	{ name: 'tenant member remove', aliases: ['tenant:member:remove'] },
	{ name: 'tenant member invite', aliases: ['tenant:member:invite'] },
	{ name: 'tenant member invite-unmanaged', aliases: ['tenant:member:invite-unmanaged'] },
	{ name: 'tenant api-key list', aliases: ['tenant:api-key:list'] },
	{ name: 'tenant api-key create', aliases: ['tenant:api-key:create'] },
	{ name: 'tenant api-key disable', aliases: ['tenant:api-key:disable'] },
	{ name: 'tenant policy list', aliases: ['tenant:policy:list'] },
	{ name: 'tenant policy create', aliases: ['tenant:policy:create'] },
	{ name: 'tenant policy update', aliases: ['tenant:policy:update'] },
	{ name: 'tenant policy delete', aliases: ['tenant:policy:delete'] },
	{ name: 'tenant mail-template list', aliases: ['tenant:mail-template:list'] },
	{ name: 'tenant mail-template add', aliases: ['tenant:mail-template:add'] },
	{ name: 'tenant mail-template remove', aliases: ['tenant:mail-template:remove'] },
]

const expectedTenantCommands = expectedCommandCatalog.map(it => it.name).filter(it => it.startsWith('tenant '))

describe('command registry', () => {
	test('every manifest command is registered, constructs, and validates its configuration', () => {
		const { dic } = createTestContainer()

		for (const expected of expectedCommandCatalog) {
			const entry = dic.commandManager.getCommands().find(it => it.name === expected.name)
			expect(entry).toBeDefined()
			if (entry === undefined) {
				continue
			}
			// getConfiguration() runs configure() and CommandConfiguration.validate()
			expect(() => entry.create().getConfiguration()).not.toThrow()
		}
	})

	test('every registered command implements execute', () => {
		const { dic } = createTestContainer()

		for (const entry of dic.commandManager.getCommands()) {
			const prototype = Object.getPrototypeOf(entry.create())
			expect(Object.getOwnPropertyNames(prototype)).toContain('execute')
		}
	})

	test('no tenant command is left as a not-implemented stub', () => {
		const stub = /not\s*yet\s*implemented|not\s*implemented|unimplemented|TODO:\s*implement/i
		const offenders = tenantSourceFiles(tenantCommandDir).filter(path => stub.test(readFileSync(path, 'utf8')))

		expect(offenders).toEqual([])
	})

	test('the public catalog contains exactly the expected canonical names and silent aliases', () => {
		const { dic } = createTestContainer()
		const registered = dic.commandManager.getCommands()
		const actualCatalog = registered.map(it => ({ name: it.name, aliases: [...it.aliases] })).sort((a, b) => a.name.localeCompare(b.name))
		const expectedCatalog = expectedCommandCatalog.map(it => ({ name: it.name, aliases: [...it.aliases] })).sort((a, b) => a.name.localeCompare(b.name))

		expect(actualCatalog).toEqual(expectedCatalog)
		for (const entry of registered) {
			for (const alias of entry.aliases) {
				expect(dic.commandList[alias]).toBe(dic.commandList[entry.name])
				const resolved = dic.commandManager.resolve([alias])
				expect(resolved.type).toBe('command')
				expect(resolved.type === 'command' ? resolved.entry.name : null).toBe(entry.name)
			}
		}
	})

	test('the legacy migr:exe shorthand resolves without becoming a catalog alias', () => {
		const { dic } = createTestContainer()
		const resolved = dic.commandManager.resolve(['migr:exe'])

		expect(resolved.type).toBe('command')
		expect(resolved.type === 'command' ? resolved.entry.name : null).toBe('migrations execute')
		expect(dic.commandManager.getCommands().find(it => it.name === 'migrations execute')?.aliases).not.toContain('migr:exe')
	})

	test('no command name is a strict prefix of another', () => {
		const { dic } = createTestContainer()
		const names = Object.keys(dic.commandList).map(normalize)

		const collisions = names.flatMap(name => names.filter(other => other !== name && other.startsWith(`${name} `)).map(other => `${name} < ${other}`))
		expect(collisions).toEqual([])
	})

	test('every command class exported by the tenant barrel is registered', () => {
		const { dic } = createTestContainer()
		const instances = dic.commandManager.getCommands().map(it => it.create())

		const exported = Object.entries(tenantCommands).filter((entry): entry is [string, new(...args: never[]) => Command<never, never>] =>
			typeof entry[1] === 'function' && entry[1].prototype instanceof Command
		)
		expect(exported.length).toBeGreaterThan(0)

		const unregistered = exported.filter(([, cls]) => !instances.some(it => it instanceof cls)).map(([name]) => name)
		expect(unregistered).toEqual([])
	})

	test('every tenant command of the contract is registered', () => {
		const { dic } = createTestContainer()
		const registered = dic.commandManager.getCommands().map(it => it.name).filter(it => it.startsWith('tenant'))

		expect(registered.sort()).toEqual([...expectedTenantCommands].sort())
	})

	test('commands --json lists every registered command, tenant ones included', async () => {
		const { dic, stdout, stderr } = createTestContainer()

		const exitCode = await dic.application.execute(['commands', '--json'])

		expect(exitCode).toBe(0)
		expect(stderr.text).toBe('')
		const listed: { name: string; aliases: string[] }[] = JSON.parse(stdout.text)
		const names = listed.map(it => it.name)
		expect(names.sort()).toEqual(dic.commandManager.getCommands().map(it => it.name).sort())
		for (const name of expectedTenantCommands) {
			expect(names).toContain(name)
		}
		expect(listed.find(it => it.name === 'tenant project secret set')?.aliases).toEqual(['tenant:project:secret:set'])
		expect(listed.find(it => it.name === 'tenant session create')?.aliases).toEqual(['tenant:session:create'])
	})
})
