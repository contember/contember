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
	 * Whether an encryption key is configured, so callers can avoid storing secrets in plaintext.
	 * Optional for backward compatibility with external embedders that construct `Providers`
	 * directly; an absent value is treated as "no key" (token-bearing IdP sessions are skipped).
	 */
	encryptionEnabled?: boolean
}
