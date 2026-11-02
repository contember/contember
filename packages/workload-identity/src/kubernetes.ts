import { CredentialsProvider } from '@contember/graphql-client'
import { TokenCache } from './TokenCache.js'

export interface KubernetesOptions {
	/** Path of the projected service account token file. */
	readonly path: string
}

/** Reads the projected token file; the kubelet rotates it, `refresh` re-reads it. */
export const kubernetes = (options: KubernetesOptions): CredentialsProvider => {
	const cache = new TokenCache('kubernetes', async () => {
		// Loaded lazily so the package entry stays importable where `node:fs` does not exist (e.g. a worker serving `issuerHandler`).
		const { readFile } = await import('node:fs/promises')
		const token = (await readFile(options.path, 'utf8')).trim()
		if (token === '') {
			throw new Error(`kubernetes: the token file ${options.path} is empty.`)
		}
		return token
	})

	return {
		authenticate: async ({ refresh }) => ({ Authorization: `Bearer ${await cache.get(refresh)}` }),
	}
}
