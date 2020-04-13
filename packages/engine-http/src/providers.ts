import uuid from 'uuid'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

export const providers = {
	uuid: () => uuid.v4(),
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
}

type Providers = typeof providers
