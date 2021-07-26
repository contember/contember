import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import crypto, { KeyObject } from 'crypto'

const cryptoAlgo = 'aes-256-gcm'

export const createProviders = (args: { encryptionKey?: KeyObject }) => ({
	uuid: () => uuidv4(),
	now: () => new Date(),
	bcrypt: async (value: string) => await bcrypt.hash(value, 10),
	bcryptCompare: (data: any, hash: string) => bcrypt.compare(data, hash),
	randomBytes: async (bytes: number) =>
		await new Promise<Buffer>((resolve, reject) => {
			crypto.randomBytes(bytes, (error, buffer) => {
				if (error) {
					reject(error)
				} else {
					resolve(buffer)
				}
			})
		}),
	encrypt: async (value: Buffer): Promise<{ encrypted: Buffer; iv: Buffer }> => {
		if (!args.encryptionKey) {
			throw new Error('encryption key not provided')
		}

		const iv = crypto.randomBytes(16)
		const cypher = crypto.createCipheriv(cryptoAlgo, args.encryptionKey, iv)
		return { encrypted: cypher.update(value), iv }
	},
	decrypt: async (valueEncrypted: Buffer, iv: Buffer): Promise<Buffer> => {
		if (!args.encryptionKey) {
			throw new Error('encryption key not provided')
		}
		const decypher = crypto.createDecipheriv(cryptoAlgo, args.encryptionKey, iv)
		return decypher.update(valueEncrypted)
	},
})

export type Providers = ReturnType<typeof createProviders>
