import { ApiKey } from '../type'
import { Providers } from '../providers'
import { plusMinutes } from '../utils/time'

const DEFAULT_EXPIRATION = 30
class ApiKeyHelper {
	public static getExpiration(providers: Providers, type: ApiKey.Type, expiration?: number): Date | null {
		switch (type) {
			case ApiKey.Type.PERMANENT:
				return null

			case ApiKey.Type.SESSION:
				return plusMinutes(providers.now(), expiration || DEFAULT_EXPIRATION)

			case ApiKey.Type.ONE_OFF:
				return null
		}
	}
}

export { ApiKeyHelper }
