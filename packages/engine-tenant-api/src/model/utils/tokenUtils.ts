import crypto from 'crypto'
import { FixedLengthHexString, isFixedLengthHexString } from './typeUtils'

export const generateToken = async (generator: {
	randomBytes: (bytes: number) => Promise<Buffer>
}): Promise<string> => {
	return (await generator.randomBytes(20)).toString('hex')
}

export type TokenHash = FixedLengthHexString<64>

export const computeTokenHash = (token: string): TokenHash => {
	return crypto //
		.createHash('sha256')
		.update(token, 'ascii')
		.digest('hex') as TokenHash
}

export const isTokenHash = (token: string): token is TokenHash => isFixedLengthHexString(token, 64)
