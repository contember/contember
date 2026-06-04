import { BinaryLike } from 'node:crypto'

export interface Providers {
	uuid: () => string
	now: () => Date
	randomBytes: (bytes: number) => Promise<Buffer>
	bcrypt: (value: string) => Promise<string>
	bcryptCompare: (data: any, encrypted: string) => Promise<boolean>
	hash: (value: BinaryLike, algo: string) => Buffer

	encrypt: (value: Buffer) => Promise<{ value: Buffer; version: number }>
	decrypt: (value: Buffer, version: number) => Promise<{ value: Buffer; needsReEncrypt: boolean }>
	/**
	 * Whether an encryption key is configured. When false, `encrypt` throws, so
	 * secrets that can fall back to plaintext-at-rest (TOTP) must do so (version 0),
	 * preserving pre-encryption behavior on deployments without a key. For the same
	 * reason, token-bearing IdP sessions are skipped when no key is configured, since
	 * refresh tokens must be encrypted at rest and must never be stored in plaintext.
	 */
	encryptionEnabled: boolean
}
