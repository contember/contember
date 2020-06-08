import crypto from 'crypto'

export const randomBytes = async (bytes: number) =>
	await new Promise<Buffer>((resolve, reject) => {
		crypto.randomBytes(bytes, (error, buffer) => {
			if (error) {
				reject(error)
			} else {
				resolve(buffer)
			}
		})
	})
