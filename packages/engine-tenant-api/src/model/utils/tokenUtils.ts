import crypto from 'crypto'

export const generateToken = async (generator: {
	randomBytes: (bytes: number) => Promise<Buffer>
}): Promise<string> => {
	return (await generator.randomBytes(20)).toString('hex')
}

export const computeTokenHash = (token: string): string => {
	return crypto //
		.createHash('sha256')
		.update(token, 'ascii')
		.digest('hex')
}
