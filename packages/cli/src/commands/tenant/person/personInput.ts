import { CliError, ExitCode } from '@contember/cli-common'
import type { StdinReader } from '../../../lib/tenant/stdin.js'
import { environmentInput, literalInput, resolveOptionalTenantInput, stdinInput, type TenantInputSource } from '../../../lib/tenant/input/index.js'

/**
 * One way of passing a secret. `name` is the option prefix, so `password` covers `--password-stdin`
 * and `--password-env`. A secret is never a plain option value — argv lands in the shell history and
 * in `ps` output of every user on the machine.
 */
export interface SecretSource {
	readonly name: string
	readonly stdin: boolean
	readonly env: string | undefined
}

export interface ResolvedSecret {
	/** The `name` of the {@link SecretSource} the value came from. */
	readonly name: string
	readonly value: string
}

/** Resolves at most one of the offered secret sources. Returns undefined when the caller passed none. */
export const resolveSecret = async (sources: readonly SecretSource[], readStdin: StdinReader): Promise<ResolvedSecret | undefined> => {
	const given = sources.flatMap(source => [
		...(source.stdin ? [{ source, flag: `--${source.name}-stdin` }] : []),
		...(source.env !== undefined ? [{ source, flag: `--${source.name}-env` }] : []),
	])
	if (given.length > 1) {
		throw new CliError(`Pass only one of ${given.map(it => it.flag).join(', ')}.`, {
			code: 'AMBIGUOUS_SECRET_SOURCE',
			exitCode: ExitCode.InputError,
		})
	}
	const chosen = given[0]
	if (chosen === undefined) {
		return undefined
	}
	// the trailing newline `echo` adds is never part of the secret
	const value = chosen.source.env !== undefined ? readSecretEnv(chosen.source.env) : (await readStdin()).replace(/\r?\n$/, '')
	if (value === '') {
		throw new CliError(`${chosen.flag} resolved to an empty value.`, { code: 'EMPTY_SECRET', exitCode: ExitCode.InputError })
	}
	return { name: chosen.source.name, value }
}

const readSecretEnv = (name: string): string => {
	const value = process.env[name]
	if (value === undefined) {
		throw new CliError(`Environment variable ${name} is not set.`, { code: 'SECRET_ENV_NOT_SET', exitCode: ExitCode.InputError })
	}
	return value
}

/** The tenant API accepts `$2b$` bcrypt hashes only — rejecting here avoids spending a rate-limit slot on a doomed call. */
export const assertBcryptHash = (hash: string): void => {
	if (!hash.startsWith('$2b$')) {
		throw new CliError('Invalid password hash: the tenant API accepts bcrypt $2b$ hashes only.', {
			code: 'INVALID_PASSWORD_HASH',
			exitCode: ExitCode.InputError,
		})
	}
}

export const parseNonNegativeInteger = (value: string | undefined, option: string): number | undefined => {
	if (value === undefined) {
		return undefined
	}
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new CliError(`--${option} must be a non-negative integer, got "${value}".`, {
			code: 'INVALID_OPTION_VALUE',
			exitCode: ExitCode.InputError,
		})
	}
	return parsed
}

export type CaptchaTokenOptions = {
	readonly ['captcha-token']?: string
	readonly ['captcha-token-env']?: string
	readonly ['captcha-token-stdin']?: boolean
}

export const configureCaptchaTokenOptions = (configuration: {
	option(name: keyof CaptchaTokenOptions): {
		valueNone(): { description(description: string): unknown }
		valueRequired(): { description(description: string): unknown }
	}
}): void => {
	configuration.option('captcha-token').valueRequired().description(
		'Captcha token. Visible in the shell history and process list; prefer --captcha-token-env or --captcha-token-stdin.',
	)
	configuration.option('captcha-token-env').valueRequired().description('Read the captcha token from the named environment variable.')
	configuration.option('captcha-token-stdin').valueNone().description('Read the captcha token from stdin.')
}

export const resolveCaptchaToken = async (
	options: CaptchaTokenOptions,
	readStdin: StdinReader,
	readEnvironment: (name: string) => string | undefined = name => process.env[name],
): Promise<string | undefined> => {
	const sources: TenantInputSource<'captcha-token'>[] = []
	if (options['captcha-token'] !== undefined) {
		sources.push(literalInput('captcha-token', '--captcha-token', options['captcha-token']))
	}
	if (options['captcha-token-env'] !== undefined) {
		sources.push(environmentInput('captcha-token', '--captcha-token-env', options['captcha-token-env']))
	}
	if (options['captcha-token-stdin'] === true) {
		sources.push(stdinInput('captcha-token', '--captcha-token-stdin'))
	}
	const resolved = await resolveOptionalTenantInput(sources, { label: 'captcha token' }, { readStdin, readEnvironment })
	if (resolved === undefined) {
		return undefined
	}
	const value = resolved.kind === 'stdin' ? removeOneTrailingLineEnding(resolved.value) : resolved.value
	if (value === '') {
		throw new CliError('The selected captcha token source resolved to an empty value.', {
			code: 'EMPTY_INPUT_VALUE',
			exitCode: ExitCode.InputError,
		})
	}
	return value
}

const removeOneTrailingLineEnding = (value: string): string => value.replace(/(?:\r\n|\n)$/, '')
