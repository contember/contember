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

/**
 * The command names the tenant unit is contracted to expose. Spelled out on purpose: the point of this
 * list is to fail when a command lands in `commands/tenant/` but never reaches `dic.ts`.
 */
const expectedTenantCommands = [
	'tenant api-key create',
	'tenant api-key disable',
	'tenant api-key list',
	'tenant apply',
	'tenant auth-log',
	'tenant config show',
	'tenant identity role add',
	'tenant identity role remove',
	'tenant idp list',
	'tenant mail-template add',
	'tenant mail-template list',
	'tenant mail-template remove',
	'tenant member add',
	'tenant member invite',
	'tenant member invite-unmanaged',
	'tenant member list',
	'tenant member remove',
	'tenant member update',
	'tenant person create',
	'tenant person disable',
	'tenant person list',
	'tenant person reset-mfa',
	'tenant person reset-password-request',
	'tenant person set-password',
	'tenant person show',
	'tenant person sign-out',
	'tenant person update',
	'tenant policy create',
	'tenant policy delete',
	'tenant policy list',
	'tenant policy update',
	'tenant project create',
	'tenant project list',
	'tenant project secret set',
	'tenant project show',
	'tenant project update',
	'tenant session create',
	'tenant session revoke',
	'tenant whoami',
]

describe('command registry', () => {
	test('every registered command constructs and its configuration validates', () => {
		const { dic } = createTestContainer()

		for (const entry of dic.commandManager.getCommands()) {
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

	test('every canonical name is the space form and its colon alias resolves to the same factory', () => {
		const { dic } = createTestContainer()

		for (const entry of dic.commandManager.getCommands()) {
			if (entry.tokens.length === 1) {
				expect(entry.aliases).toEqual([])
				continue
			}
			const colonForm = entry.tokens.join(':')
			// the space form must be registered first, otherwise the colon form would become the canonical name
			expect(entry.aliases).toEqual([colonForm])
			expect(dic.commandList[colonForm]).toBe(dic.commandList[entry.name])
			const resolved = dic.commandManager.resolve([colonForm])
			expect(resolved.type).toBe('command')
			expect(resolved.type === 'command' ? resolved.entry.name : null).toBe(entry.name)
		}
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
