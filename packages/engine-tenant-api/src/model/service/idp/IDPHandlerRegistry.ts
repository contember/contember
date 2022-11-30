import { IdentityProviderHandler } from './IdentityProviderHandler'
import { IdentityProviderNotFoundError } from './IdentityProviderNotFoundError'

export class IDPHandlerRegistry {
	private providers: Record<string, IdentityProviderHandler<{}, {}, {}>> = {}

	public registerHandler(type: string, provider: IdentityProviderHandler<{}, {}, {}>): void {
		this.providers[type] = provider
	}

	public getHandler(type: string): IdentityProviderHandler<{}, {}, {}> {
		const provider = this.providers[type]
		if (!provider) {
			throw new IdentityProviderNotFoundError(`Identity provider handler ${type} not found`)
		}
		return provider
	}
}
