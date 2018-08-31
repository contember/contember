import * as crypto from 'crypto'

namespace ApiKey {
	export function computeTokenHash(token: string): string {
		return crypto
			.createHash('sha256')
			.update(token, 'ascii')
			.digest('hex')
	}

	export const enum Type {
		SESSION = 'session',
		PERMANENT = 'permanent'
	}
}

export default ApiKey
