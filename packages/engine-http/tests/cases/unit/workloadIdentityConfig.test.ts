import { afterAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rootCertificates } from 'node:tls'
import { readConfig } from '../../../src/config/config.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'

const parse = (workloadIdentity: unknown) => serverConfigSchema({ workloadIdentity }).workloadIdentity

const tempDir = mkdtempSync(join(tmpdir(), 'contember-workload-identity-'))
afterAll(() => rmSync(tempDir, { recursive: true, force: true }))

const writeTempFile = (name: string, content: string): string => {
	const path = join(tempDir, name)
	writeFileSync(path, content)
	return path
}

describe('server.workloadIdentity', () => {
	test('absent when not configured', () => {
		expect(serverConfigSchema({}).workloadIdentity).toBeUndefined()
		expect(parse({})).toStrictEqual({})
	})

	test('insecureIssuers: comma-separated hosts are split, trimmed and lower-cased', () => {
		expect(parse({ insecureIssuers: 'localhost, Host.Docker.Internal ,127.0.0.1' })?.insecureIssuers).toStrictEqual([
			'localhost',
			'host.docker.internal',
			'127.0.0.1',
		])
	})

	test('insecureIssuers: an array is accepted and an empty value means none', () => {
		expect(parse({ insecureIssuers: ['localhost'] })?.insecureIssuers).toStrictEqual(['localhost'])
		expect(parse({ insecureIssuers: '' })?.insecureIssuers).toBeUndefined()
	})

	test('insecureIssuers: a URL or a CIDR is refused', () => {
		expect(() => parse({ insecureIssuers: 'http://localhost:3000' })).toThrow()
		expect(() => parse({ insecureIssuers: '10.0.0.0/8' })).toThrow()
	})

	test('egressAllowlist: hostnames, CIDRs and bare addresses', () => {
		expect(parse({ egressAllowlist: 'keycloak.internal, 10.20.0.0/16, 10.0.0.7, fd00::1' })?.egressAllowlist).toStrictEqual([
			'keycloak.internal',
			'10.20.0.0/16',
			'10.0.0.7/32',
			'fd00::1/128',
		])
	})

	test('egressAllowlist: an invalid CIDR or host is refused', () => {
		expect(() => parse({ egressAllowlist: '10.0.0.0/99' })).toThrow()
		expect(() => parse({ egressAllowlist: 'not a host' })).toThrow()
	})

	test('jwksMaxStaleness: a duration is parsed to seconds', () => {
		expect(parse({ jwksMaxStaleness: '6h' })?.jwksMaxStaleness).toBe(21600)
		expect(parse({ jwksMaxStaleness: '30m' })?.jwksMaxStaleness).toBe(1800)
		expect(parse({ jwksMaxStaleness: '90s' })?.jwksMaxStaleness).toBe(90)
		expect(parse({ jwksMaxStaleness: '1d' })?.jwksMaxStaleness).toBe(86400)
		expect(parse({ jwksMaxStaleness: '600' })?.jwksMaxStaleness).toBe(600)
		expect(parse({ jwksMaxStaleness: 120 })?.jwksMaxStaleness).toBe(120)
	})

	test('jwksMaxStaleness: an unknown unit or a negative number is refused', () => {
		expect(() => parse({ jwksMaxStaleness: '6 hours' })).toThrow()
		expect(() => parse({ jwksMaxStaleness: '1w' })).toThrow()
		expect(() => parse({ jwksMaxStaleness: -5 })).toThrow()
	})

	test('caCertificates: a PEM bundle is read and split into certificates', () => {
		const bundle = `${rootCertificates[0]}\n${rootCertificates[1]}\n`
		const certificates = parse({ caCertificates: writeTempFile('bundle.pem', bundle) })?.caCertificates
		expect(certificates).toHaveLength(2)
		expect(certificates?.[0]).toBe(rootCertificates[0].trim())
	})

	test('caCertificates: a missing file, a file without certificates or a corrupt certificate fails the boot', () => {
		expect(() => parse({ caCertificates: join(tempDir, 'missing.pem') })).toThrow()
		expect(() => parse({ caCertificates: writeTempFile('empty.pem', 'nothing here') })).toThrow()
		const corrupt = '-----BEGIN CERTIFICATE-----\nbm90IGEgY2VydGlmaWNhdGU=\n-----END CERTIFICATE-----\n'
		expect(() => parse({ caCertificates: writeTempFile('corrupt.pem', corrupt) })).toThrow()
	})

	test('read from the CONTEMBER_WORKLOAD_IDENTITY_* environment variables', async () => {
		const caFile = writeTempFile('env.pem', rootCertificates[0])
		const env = {
			CONTEMBER_WORKLOAD_IDENTITY_EGRESS_ALLOWLIST: 'keycloak.internal,10.20.0.0/16',
			CONTEMBER_WORKLOAD_IDENTITY_INSECURE_ISSUERS: 'localhost,host.docker.internal',
			CONTEMBER_WORKLOAD_IDENTITY_CA_CERTIFICATES: caFile,
			CONTEMBER_WORKLOAD_IDENTITY_JWKS_MAX_STALENESS: '2h',
		}
		Object.assign(process.env, env)
		try {
			const { serverConfig } = await readConfig()
			expect(serverConfig.workloadIdentity).toStrictEqual({
				egressAllowlist: ['keycloak.internal', '10.20.0.0/16'],
				insecureIssuers: ['localhost', 'host.docker.internal'],
				caCertificates: [rootCertificates[0].trim()],
				jwksMaxStaleness: 7200,
			})
		} finally {
			for (const name of Object.keys(env)) {
				delete process.env[name]
			}
		}
	})

	test('nothing is set when the environment variables are unset', async () => {
		const { serverConfig } = await readConfig()
		expect(serverConfig.workloadIdentity).toStrictEqual({})
	})
})
