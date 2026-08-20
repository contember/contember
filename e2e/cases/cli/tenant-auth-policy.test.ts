import { expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { apiUrl, rand, rootToken } from '../../src/tester.js'

const repoRoot = resolve(import.meta.dir, '../../..')
const cliEntry = join(repoRoot, 'packages/cli/src/run.ts')

const runCli = async (args: string[]) => {
	const proc = Bun.spawn(['bun', '--conditions=typescript', cliEntry, ...args], {
		cwd: repoRoot,
		env: {
			...process.env,
			CONTEMBER_API_URL: apiUrl,
			CONTEMBER_API_TOKEN: rootToken,
			CONTEMBER_CLI_PACKAGE_ROOT: join(repoRoot, 'packages/cli'),
			CONTEMBER_DIR: repoRoot,
			CONTEMBER_DSN: '',
			// Auth policies are tenant-global; the project only satisfies connection resolution
			// in `tenant apply`, which refuses to run without one.
			CONTEMBER_PROJECT_NAME: `cli_policy_${rand()}`,
			CONTEMBER_SKIP_VERSION_CHECK: '1',
			NO_COLOR: '1',
		},
		stdin: 'ignore',
		stdout: 'pipe',
		stderr: 'pipe',
	})
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	])
	return { stdout, stderr, exitCode }
}

/** A row of `tenant policy list --json`. */
interface ListedPolicy {
	id: string
	scope: string
	project: string | null
	roles: string[]
	mfaRequired: boolean | null
	tokenExpiration: string | null
	idleTimeout: string | null
	mfaGraceDuration: string | null
	rememberMeAllowed: boolean | null
}

const listPolicies = async (role: string): Promise<ListedPolicy[]> => {
	const result = await runCli(['tenant', 'policy', 'list', '--json'])
	expect(result.exitCode).toBe(0)
	const policies: ListedPolicy[] = JSON.parse(result.stdout)
	// The tenant is shared with every other e2e case, so only this run's role is ours to assert on.
	return policies.filter(it => it.roles.includes(role))
}

test('CLI: tenant apply reconciles auth policies against a live tenant', async () => {
	// A role no identity holds, so the policy this test creates stays inert for the rest of the suite.
	const role = `e2e_cli_policy_${rand()}`
	const secondRole = `${role}_b`
	// describeAuthPolicy sorts, because the roles are a set
	const target = `global [${[role, secondRole].sort().join(', ')}]`
	const workspace = await fs.mkdtemp(join(repoRoot, 'e2e/.tmp-auth-policy-'))

	const writeConfig = async (authPolicies: unknown[]): Promise<string> => {
		const path = join(workspace, 'tenant.config.ts')
		await fs.writeFile(
			path,
			`import { defineTenantConfig } from '@contember/cli'\n\n`
				+ `export default defineTenantConfig({ authPolicies: ${JSON.stringify(authPolicies)} })\n`,
		)
		return path
	}

	try {
		const policy = { scope: 'global', roles: [role, secondRole], mfaRequired: true, idleTimeout: 'PT30M' }

		// A policy the tenant does not have yet is created.
		const createConfig = await writeConfig([policy])
		const created = await runCli(['tenant', 'apply', createConfig, '--json'])
		expect(created.exitCode).toBe(0)
		expect(created.stderr).toBe('')
		const createdPayload = JSON.parse(created.stdout)
		expect(createdPayload.actions).toEqual([{ action: 'createAuthPolicy', target }])
		expect(createdPayload.warnings.map((it: { target: string }) => it.target)).not.toContain(target)

		// It reached the server with every field, and the Interval scalar round-trips.
		expect(await listPolicies(role)).toEqual([{
			id: expect.any(String),
			scope: 'global',
			project: null,
			roles: [role, secondRole],
			mfaRequired: true,
			tokenExpiration: null,
			idleTimeout: 'PT30M',
			mfaGraceDuration: null,
			rememberMeAllowed: null,
		}])

		// Re-applying updates the row it already matches. A policy has no slug, so this is the whole
		// reconciliation contract — and the roles are a *set*, so reversing them still means the same policy.
		const reordered = { ...policy, roles: [secondRole, role], mfaRequired: false }
		const reapplied = await runCli(['tenant', 'apply', await writeConfig([reordered]), '--json'])
		expect(reapplied.exitCode).toBe(0)
		expect(JSON.parse(reapplied.stdout).actions).toEqual([{ action: 'updateAuthPolicy', target }])

		const afterUpdate = await listPolicies(role)
		expect(afterUpdate).toHaveLength(1)
		expect(afterUpdate[0].mfaRequired).toBe(false)

		// `authPolicies: []` means "I manage policies and there are none", so the leftover is reported.
		// `output.warn` writes nothing under --json, which is why the warning has to be in the payload.
		const orphaned = await runCli(['tenant', 'apply', await writeConfig([]), '--json'])
		expect(orphaned.exitCode).toBe(0)
		expect(orphaned.stderr).toBe('')
		const orphanedPayload = JSON.parse(orphaned.stdout)
		expect(orphanedPayload.actions).toEqual([])
		expect(orphanedPayload.warnings).toContainEqual({
			code: 'UNMANAGED_AUTH_POLICY',
			target,
			message: `Auth policy ${target} exists but is not in the config; it stays in effect.`,
		})

		// Nothing is ever pruned — the leftover is reported, not removed.
		expect(await listPolicies(role)).toHaveLength(1)

		// Two entries with the same target would create two rows the next apply could not tell apart,
		// so they are rejected up front.
		const duplicate = await runCli([
			'tenant',
			'apply',
			await writeConfig([{ scope: 'global', roles: [role, secondRole] }, { scope: 'global', roles: [secondRole, role] }]),
			'--json',
		])
		expect(duplicate.exitCode).toBe(1)
		expect(duplicate.stdout).toBe('')
		expect(JSON.parse(duplicate.stderr)).toMatchObject({ ok: false, error: { code: 'ERROR' } })
		expect(duplicate.stderr).toContain('Duplicate auth policy')

		// The rejected run wrote nothing: the pre-existing row is untouched and no second one appeared.
		expect(await listPolicies(role)).toHaveLength(1)

		// Removing it is explicit, exactly as the leftover warning tells the operator to do.
		const [leftover] = await listPolicies(role)
		const deleted = await runCli(['tenant', 'policy', 'delete', leftover.id, '--yes', '--json'])
		expect(deleted.exitCode).toBe(0)
		expect(JSON.parse(deleted.stdout)).toEqual({ id: leftover.id })
		expect(await listPolicies(role)).toEqual([])
	} finally {
		// A safety net for a failed assertion above: it must not mask the real error, so it asserts nothing.
		const listed = await runCli(['tenant', 'policy', 'list', '--json'])
		if (listed.exitCode === 0) {
			const stale: ListedPolicy[] = JSON.parse(listed.stdout)
			for (const policy of stale.filter(it => it.roles.includes(role))) {
				await runCli(['tenant', 'policy', 'delete', policy.id, '--yes', '--json'])
			}
		}
		await fs.rm(workspace, { recursive: true, force: true })
	}
}, 120000)
