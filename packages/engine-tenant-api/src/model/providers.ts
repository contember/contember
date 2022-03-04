import { BinaryLike } from 'crypto'

export interface Providers {
	uuid: () => string
	now: () => Date
	randomBytes: (bytes: number) => Promise<Buffer>
	bcrypt: (value: string) => Promise<string>
	bcryptCompare: (data: any, encrypted: string) => Promise<boolean>
	hash: (value: BinaryLike, algo: string) => Buffer

	encrypt: (value: Buffer) => Promise<{ value: Buffer; version: number }>
	decrypt: (value: Buffer, version: number) => Promise<{ value: Buffer; needsReEncrypt: boolean }>
}
