import { BinaryLike } from 'crypto'

export interface Providers {
	uuid: () => string
	now: () => Date
	randomBytes: (bytes: number) => Promise<Buffer>
	bcrypt: (value: string) => Promise<string>
	bcryptCompare: (data: any, encrypted: string) => Promise<boolean>
	hash: (value: BinaryLike, algo: string) => Buffer

	encrypt: (data: Buffer) => Promise<{ encrypted: Buffer; iv: Buffer }>
	decrypt: (encrypted: Buffer, iv: Buffer) => Promise<Buffer>
}
