import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import crypto, { BinaryLike } from 'crypto'


export const createProviders = () => ({
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
	hash: (value: BinaryLike, algo: string): Buffer => (
		crypto.createHash(algo).update(value).digest()
	),
})

export type Providers = ReturnType<typeof createProviders>
