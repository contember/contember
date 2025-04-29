import { Config } from '../type/Config'
import { blacklist } from '../utils/blacklist'
import { WeakPasswordReason } from '../../schema'
import { ResponseError, Response, ResponseOk } from '../utils/Response'

export class PasswordStrengthValidator {
	public async verify<const Code extends string>(password: string, passwordConfig: Config['password'], errorCode: Code): Promise<ResponseOk<null> | ResponseError<Code, {
		weakPasswordReasons: WeakPasswordReason[]
	}>> {
		const failureReasons: WeakPasswordReason[] = []
		const developerMessage: string[] = []

		if (password.length < passwordConfig.minLength) {
			failureReasons.push('TOO_SHORT')
			developerMessage.push(`Password is too short. Minimum length is ${passwordConfig.minLength}.`)
		}

		if (passwordConfig.requireUppercase > 0 && (password.match(/[A-Z]/g) || []).length < passwordConfig.requireUppercase) {
			failureReasons.push('MISSING_UPPERCASE')
			developerMessage.push(`Password must contain at least ${passwordConfig.requireUppercase} uppercase letter${passwordConfig.requireUppercase > 1 ? 's' : ''}.`)
		}

		if (passwordConfig.requireLowercase > 0 && (password.match(/[a-z]/g) || []).length < passwordConfig.requireLowercase) {
			failureReasons.push('MISSING_LOWERCASE')
			developerMessage.push(`Password must contain at least ${passwordConfig.requireLowercase} lowercase letter${passwordConfig.requireLowercase > 1 ? 's' : ''}.`)
		}

		if (passwordConfig.requireDigit > 0 && (password.match(/\d/g) || []).length < passwordConfig.requireDigit) {
			failureReasons.push('MISSING_DIGIT')
			developerMessage.push(`Password must contain at least ${passwordConfig.requireDigit} digit${passwordConfig.requireDigit > 1 ? 's' : ''}.`)
		}

		if (passwordConfig.requireSpecial > 0 && (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length < passwordConfig.requireSpecial) {
			failureReasons.push('MISSING_SPECIAL')
			developerMessage.push(`Password must contain at least ${passwordConfig.requireSpecial} special character${passwordConfig.requireSpecial > 1 ? 's' : ''}.`)
		}

		if (passwordConfig.pattern && !new RegExp(passwordConfig.pattern).test(password)) {
			failureReasons.push('INVALID_PATTERN')
			developerMessage.push(`Password does not match the required pattern: ${passwordConfig.pattern}.`)
		}

		if (passwordConfig.checkBlacklist && this.isBlacklisted(password.toLowerCase())) {
			failureReasons.push('BLACKLISTED')
			developerMessage.push(`Password is blacklisted.`)
		}

		if (failureReasons.length > 0) {
			return new ResponseError(errorCode as any, developerMessage.join(' '), {
				weakPasswordReasons: failureReasons,
			})
		}
		return new ResponseOk(null)
	}


	private isBlacklisted(password: string): boolean {
		return blacklist.has(password) || blacklist.has(this.decodeLeetspeak(password))
	}

	private decodeLeetspeak(input: string): string {
		const leetspeakMap: { [key: string]: string } = {
			'@': 'a',
			'$': 's',
			'0': 'o',
			'1': 'l',
			'3': 'e',
			'7': 't',
			'!': 'i',
		}
		return input
			.split('')
			.map(char => {
				return leetspeakMap[char] || char
			})
			.join('')
	}
}

namespace PasswordStrengthValidator {
	export type Result =
		| { ok: true }
		| { ok: false; reasons: WeakPasswordReason[]; message: string }
}

