import { IdentityProviderHandler } from './IdentityProviderHandler.js'
import { IdentityProviderNotFoundError } from './IdentityProviderNotFoundError.js'

export class IDPHandlerRegistry {
	private providers: Record<string, IdentityProviderHandler<any, any>> = {}

	public registerHandler(type: string, provider: IdentityProviderHandler<any, any>): void {
		this.providers[type] = provider
	}

	public getHandler(type: string): IdentityProviderHandler<any, any> {
		const provider = this.providers[type]
		if (!provider) {
			throw new IdentityProviderNotFoundError(`Identity provider handler ${type} not found`)
		}
		return provider
	}
}
