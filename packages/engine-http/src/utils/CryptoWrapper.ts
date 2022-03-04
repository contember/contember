import * as crypto from 'crypto'

export class CryptoWrapper {
	public static cryptoAlgo = 'aes-256-gcm' as const
	public static cryptoVersion = 2

	constructor(
		private readonly encryptionKey?: crypto.KeyObject,
	) {
	}

	async encrypt(value: Buffer): Promise<{ value: Buffer; version: number }> {
		if (!this.encryptionKey) {
			throw new Error('encryption key not provided')
		}

		const iv = crypto.randomBytes(16)
		const cipher = crypto.createCipheriv(CryptoWrapper.cryptoAlgo, this.encryptionKey, iv)
		return {
			value: Buffer.concat([cipher.update(value), cipher.final(), iv, cipher.getAuthTag()]),
			version: CryptoWrapper.cryptoVersion,
		}
	}

	async decrypt(value: Buffer, version: number): Promise<{ value: Buffer; needsReEncrypt: boolean }> {
		if (!this.encryptionKey) {
			throw new Error('encryption key not provided')
		}
		if (version === 1) {
			const decipher = crypto.createDecipheriv(CryptoWrapper.cryptoAlgo, this.encryptionKey, value.subarray(-16))
			return {
				value: decipher.update(value.subarray(0, -16)),
				needsReEncrypt: true,
			}
		} else if (version === 2) {
			const decipher = crypto.createDecipheriv(CryptoWrapper.cryptoAlgo, this.encryptionKey, value.subarray(-32, -16))
			decipher.setAuthTag(value.subarray(-16))
			return {
				value: Buffer.concat([decipher.update(value.subarray(0, -32)), decipher.final()]),
				needsReEncrypt: false,
			}
		}
		throw new Error('unsupported version')
	}
}
