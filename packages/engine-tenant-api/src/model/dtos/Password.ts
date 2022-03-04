import { Providers } from '../providers'


export type MaybePassword = Password | typeof NoPassword

export const NoPassword = {
	getPlain: () => null,
	getHash: () => null,
}

export interface Password {
	getPlain(): string | null

	getHash(providers: Providers): Promise<string>
}

export class PasswordHash implements Password {
	constructor(private readonly hash: string) {
	}

	getHash(providers: Providers): Promise<string> {
		return Promise.resolve(this.hash)
	}

	getPlain(): string | null {
		return null
	}
}

export class PasswordPlain implements Password {
	constructor(private readonly plain: string) {
	}

	getHash(providers: Providers) {
		return providers.bcrypt(this.plain)
	}

	getPlain() {
		return this.plain
	}
}
