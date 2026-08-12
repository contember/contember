import { CliError, escapeTerminalText, ExitCode } from '@contember/cli-common'

/** Escapes an untrusted fragment before it is interpolated into human-readable stdout. */
export const humanText = (value: string): string => escapeTerminalText(value)

export const requireNonEmptyTenantName = (value: string | undefined, subject: 'Person' | 'Project'): string | undefined => {
	if (value !== undefined && value.trim() === '') {
		throw new CliError(`${subject} name must not be empty.`, {
			code: 'EMPTY_NAME',
			exitCode: ExitCode.InputError,
		})
	}
	return value
}

export const assertTenantCredentialContract = (valid: boolean, kind: 'API key' | 'deployer' | 'session'): void => {
	if (!valid) {
		invalidTenantCredential(kind)
	}
}

/** Generated tenant credentials are 20 random bytes encoded as lowercase hexadecimal. */
export const assertGeneratedTenantToken = (token: string, kind: 'API key' | 'deployer' | 'session'): string => {
	if (!/^[0-9a-f]{40}$/.test(token)) {
		invalidTenantCredential(kind)
	}
	return token
}

const invalidTenantCredential = (kind: 'API key' | 'deployer' | 'session'): never => {
	throw new CliError(`The tenant API returned an invalid ${kind} token.`, {
		code: 'TENANT_API_INVALID_CREDENTIAL',
		exitCode: ExitCode.InternalError,
	})
}
