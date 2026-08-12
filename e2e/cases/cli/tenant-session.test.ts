import { expect, test } from 'bun:test'
import { join, resolve } from 'node:path'
import { TenantClient } from '../../src/TenantClient.js'
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
			CONTEMBER_PROJECT_NAME: 'cli_session_test',
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

const requireStringField = (value: unknown, field: string): string => {
	if (typeof value !== 'object' || value === null || !(field in value) || typeof value[field] !== 'string') {
		throw new Error(`Expected JSON field ${field} to be a string`)
	}
	return value[field]
}

const findPerson = async (email: string): Promise<{ id: string; name: string }> => {
	const response = await fetch(`${apiUrl}/tenant`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${rootToken}`,
		},
		body: JSON.stringify({
			query: 'query($email: String!) { persons(filter: { email: $email }) { id name } }',
			variables: { email },
		}),
	})
	const body: unknown = await response.json()
	if (typeof body !== 'object' || body === null || !('data' in body)) {
		throw new Error('Expected the Tenant API to return data')
	}
	const data = body.data
	if (typeof data !== 'object' || data === null || !('persons' in data) || !Array.isArray(data.persons) || data.persons.length !== 1) {
		throw new Error(`Expected exactly one person for ${email}`)
	}
	return {
		id: requireStringField(data.persons[0], 'id'),
		name: requireStringField(data.persons[0], 'name'),
	}
}

const expectSessionIdentity = async (token: string, identityId: string, email: string): Promise<void> => {
	const response = await fetch(`${apiUrl}/tenant`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ query: 'query { me { id person { email } } }' }),
	})
	const body: unknown = await response.json()

	expect(response.status).toBe(200)
	expect(body).toMatchObject({
		data: {
			me: {
				id: identityId,
				person: { email },
			},
		},
	})
}

test('CLI: tenant session create is discoverable and keeps structured output process-safe', async () => {
	const catalogResult = await runCli(['commands', '--json'])
	expect(catalogResult.exitCode).toBe(0)
	expect(catalogResult.stderr).toBe('')
	const catalog: unknown = JSON.parse(catalogResult.stdout)
	expect(Array.isArray(catalog)).toBe(true)
	if (!Array.isArray(catalog)) {
		throw new Error('Expected the command catalog to be an array')
	}
	const sessionCreate = catalog.find(entry =>
		typeof entry === 'object'
		&& entry !== null
		&& 'name' in entry
		&& entry.name === 'tenant session create'
	)
	expect(sessionCreate).toMatchObject({
		name: 'tenant session create',
		aliases: ['tenant:session:create'],
		options: expect.arrayContaining([
			expect.objectContaining({ name: 'email', mode: 'value_required' }),
			expect.objectContaining({ name: 'person-id', mode: 'value_required' }),
			expect.objectContaining({ name: 'json', global: true }),
			expect.objectContaining({ name: 'quiet', shortcut: 'q', global: true }),
		]),
	})

	const tenant = new TenantClient(apiUrl, rootToken)
	const email = `cli-session-${rand()}@example.com`
	const identityId = await tenant.signUp(email)
	const person = await findPerson(email)

	// A one-minute lifetime bounds the credentials created by this test without needing their opaque session ids.
	const jsonResult = await runCli(['tenant', 'session', 'create', '--email', email, '--expiration', '1', '--json'])
	expect(jsonResult.exitCode).toBe(0)
	expect(jsonResult.stderr).toBe('')
	const jsonPayload: unknown = JSON.parse(jsonResult.stdout)
	const jsonToken = requireStringField(jsonPayload, 'token')
	expect(jsonToken).toHaveLength(40)
	expect(jsonPayload).toEqual({ token: jsonToken, personId: person.id, identityId, email, name: person.name })
	expect(jsonResult.stdout).not.toContain(rootToken)
	expect(jsonResult.stderr).not.toContain(jsonToken)
	expect(jsonResult.stderr).not.toContain(rootToken)
	await expectSessionIdentity(jsonToken, identityId, email)

	const quietResult = await runCli(['tenant', 'session', 'create', '--email', email, '--expiration', '1', '--quiet'])
	expect(quietResult.exitCode).toBe(0)
	expect(quietResult.stderr).toBe('')
	const quietLines = quietResult.stdout.split('\n')
	expect(quietLines).toHaveLength(2)
	expect(quietLines[1]).toBe('')
	const quietToken = quietLines[0]
	expect(quietToken).toHaveLength(40)
	expect(quietResult.stdout).not.toContain(rootToken)
	expect(quietResult.stderr).not.toContain(quietToken)
	expect(quietResult.stderr).not.toContain(rootToken)
	await expectSessionIdentity(quietToken, identityId, email)

	const missingEmail = `missing-cli-session-${rand()}@example.com`
	const errorResult = await runCli(['tenant', 'session', 'create', '--email', missingEmail, '--json'])
	expect(errorResult.exitCode).toBe(3)
	expect(errorResult.stdout).toBe('')
	const errorPayload: unknown = JSON.parse(errorResult.stderr)
	expect(errorPayload).toMatchObject({
		ok: false,
		error: {
			code: 'UNKNOWN_EMAIL',
			retryable: false,
		},
	})
	expect(errorResult.stderr).not.toContain(rootToken)
}, 60000)
