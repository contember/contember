import { Providers } from '../providers.js'
import { Secret, TOTP, URI } from 'otpauth'

export interface OtpData {
	secret: string
	uri: string
}

const digits = 6

export class OtpAuthenticator {
	constructor(
		private readonly providers: Pick<Providers, 'now' | 'randomBytes'>,
	) {
	}

	public validate(secret: SecretLike, token: string): boolean {
		return this.matchCounter(secret, token) !== null
	}

	/** Returns the time-step counter the token belongs to, or null when the token is not valid now. */
	public matchCounter(secret: SecretLike, token: string): number | null {
		const timestamp = this.providers.now().getTime()
		const delta = TOTP.validate({
			token,
			digits,
			secret: getSecret(secret),
			timestamp,
		})
		return delta === null ? null : TOTP.counter({ timestamp }) + delta
	}

	public generate(secret: SecretLike): string {
		return TOTP.generate({
			secret: getSecret(secret),
			digits,
			timestamp: this.providers.now().getTime(),
		})
	}

	public async create(user: string, label: string): Promise<OtpData> {
		const secret = new Secret({ buffer: (await this.providers.randomBytes(20)) as any })
		const totp = new TOTP({
			label: user,
			issuer: label,
			secret,
		})
		return {
			secret: secret.base32,
			uri: totp.toString(),
		}
	}
}

type SecretLike = { uri: string } | { secret: string }
const getSecret = function(otp: SecretLike): Secret {
	return 'uri' in otp ? (URI.parse(otp.uri).secret) : Secret.fromBase32(otp.secret)
}
