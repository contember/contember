import { createHash } from 'node:crypto'

/**
 * Looks up a password in the Have-I-Been-Pwned passwords corpus using its
 * k-anonymity API: the client sends only the first 5 hex chars of the SHA-1
 * hash, the server returns all matching suffixes plus counts.
 *
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 *
 * Implementations are expected to be fail-open: when the upstream is down or
 * misbehaves, `isCompromised` should resolve to `false`, never throw.
 */
export interface HibpChecker {
	isCompromised(password: string): Promise<boolean>
}

export class HttpHibpChecker implements HibpChecker {
	constructor(
		private readonly endpoint: string = 'https://api.pwnedpasswords.com/range/',
		private readonly fetchImpl: typeof fetch = fetch,
		private readonly timeoutMs: number = 1500,
	) {}

	async isCompromised(password: string): Promise<boolean> {
		const sha1 = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase()
		const prefix = sha1.slice(0, 5)
		const suffix = sha1.slice(5)
		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), this.timeoutMs)
		try {
			const response = await this.fetchImpl(`${this.endpoint}${prefix}`, {
				headers: { 'Add-Padding': 'true' },
				signal: controller.signal,
			})
			if (!response.ok) {
				return false
			}
			const body = await response.text()
			for (const line of body.split('\n')) {
				const [hashSuffix, countStr] = line.trim().split(':')
				if (hashSuffix === suffix && Number(countStr) > 0) {
					return true
				}
			}
			return false
		} catch {
			return false
		} finally {
			clearTimeout(timer)
		}
	}
}

/** Disabled checker — used when HIBP integration is turned off in tenant config. */
export class NoopHibpChecker implements HibpChecker {
	async isCompromised(_password: string): Promise<boolean> {
		return false
	}
}
