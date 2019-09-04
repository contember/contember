import { ApiKey } from '../'
import { Providers } from '../providers'

class ApiKeyHelper {
	public static getExpiration(providers: Providers, type: ApiKey.Type, expiration?: number): Date | null {
		switch (type) {
			case ApiKey.Type.PERMANENT:
				return null

			case ApiKey.Type.SESSION:
				return new Date(providers.now().getTime() + (expiration || 30 * 60) * 1000)

			case ApiKey.Type.ONE_OFF:
				return null
		}
	}
}

export { ApiKeyHelper }
