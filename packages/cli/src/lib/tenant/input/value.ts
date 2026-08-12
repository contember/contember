import { CliError, ExitCode } from '@contember/cli-common'
import { readStdinText, type StdinReader } from '../stdin.js'

interface InputSourceBase<Name extends string> {
	/** Identifies the semantic value, for example `password` or `password-hash`. */
	readonly name: Name
	/** Identifies the selected option without including its submitted value. */
	readonly flag: string
}

export interface LiteralInputSource<Name extends string = string> extends InputSourceBase<Name> {
	readonly kind: 'literal'
	readonly value: string
}

export interface EnvironmentInputSource<Name extends string = string> extends InputSourceBase<Name> {
	readonly kind: 'environment'
	readonly variable: string
}

export interface StdinInputSource<Name extends string = string> extends InputSourceBase<Name> {
	readonly kind: 'stdin'
}

/** One explicitly selected input source. Unselected options must not be included. */
export type TenantInputSource<Name extends string = string> =
	| LiteralInputSource<Name>
	| EnvironmentInputSource<Name>
	| StdinInputSource<Name>

export type TrailingLineEnding = 'preserve' | 'remove-one'

export interface TenantInputOptions {
	/** A non-sensitive description used in errors, for example `project secret`. */
	readonly label: string
	readonly allowEmpty?: boolean
	readonly trailingLineEnding?: TrailingLineEnding
}

export interface TenantInputDependencies {
	readonly readStdin?: StdinReader
	readonly readEnvironment?: (name: string) => string | undefined
}

export interface ResolvedTenantInput<Name extends string = string> {
	readonly name: Name
	readonly kind: TenantInputSource<Name>['kind']
	readonly value: string
}

export const literalInput = <Name extends string>(name: Name, flag: string, value: string): LiteralInputSource<Name> => ({
	kind: 'literal',
	name,
	flag,
	value,
})

export const environmentInput = <Name extends string>(name: Name, flag: string, variable: string): EnvironmentInputSource<Name> => ({
	kind: 'environment',
	name,
	flag,
	variable,
})

export const stdinInput = <Name extends string>(name: Name, flag: string): StdinInputSource<Name> => ({
	kind: 'stdin',
	name,
	flag,
})

/** Resolves exactly one explicitly selected source. */
export const resolveRequiredTenantInput = async <Name extends string>(
	sources: readonly TenantInputSource<Name>[],
	options: TenantInputOptions,
	dependencies: TenantInputDependencies = {},
): Promise<ResolvedTenantInput<Name>> => {
	const source = selectSource(sources, options.label, true)
	return await resolveSelectedSource(source, options, dependencies)
}

/** Resolves at most one explicitly selected source without reading stdin when none was selected. */
export const resolveOptionalTenantInput = async <Name extends string>(
	sources: readonly TenantInputSource<Name>[],
	options: TenantInputOptions,
	dependencies: TenantInputDependencies = {},
): Promise<ResolvedTenantInput<Name> | undefined> => {
	const source = selectSource(sources, options.label, false)
	return source === undefined ? undefined : await resolveSelectedSource(source, options, dependencies)
}

function selectSource<Name extends string>(
	sources: readonly TenantInputSource<Name>[],
	label: string,
	required: true,
): TenantInputSource<Name>
function selectSource<Name extends string>(
	sources: readonly TenantInputSource<Name>[],
	label: string,
	required: false,
): TenantInputSource<Name> | undefined
function selectSource<Name extends string>(
	sources: readonly TenantInputSource<Name>[],
	label: string,
	required: boolean,
): TenantInputSource<Name> | undefined {
	if (sources.length > 1) {
		throw inputError(`Select only one input source for ${label}: ${sources.map(source => source.flag).join(', ')}.`, 'AMBIGUOUS_INPUT_SOURCE')
	}
	const source = sources[0]
	if (source === undefined && required) {
		throw inputError(`Select an input source for ${label}.`, 'MISSING_INPUT_SOURCE')
	}
	return source
}

const resolveSelectedSource = async <Name extends string>(
	source: TenantInputSource<Name>,
	options: TenantInputOptions,
	dependencies: TenantInputDependencies,
): Promise<ResolvedTenantInput<Name>> => {
	const value = await readSource(source, dependencies)
	const normalized = options.trailingLineEnding === 'remove-one' ? removeOneTrailingLineEnding(value) : value
	if (normalized === '' && options.allowEmpty !== true) {
		throw inputError(`${source.flag} resolved to an empty value for ${options.label}.`, 'EMPTY_INPUT_VALUE')
	}
	return { name: source.name, kind: source.kind, value: normalized }
}

const readSource = async <Name extends string>(source: TenantInputSource<Name>, dependencies: TenantInputDependencies): Promise<string> => {
	switch (source.kind) {
		case 'literal':
			return source.value
		case 'environment': {
			const value = (dependencies.readEnvironment ?? readEnvironment)(source.variable)
			if (value === undefined) {
				throw inputError(`Environment variable ${source.variable} selected by ${source.flag} is not set.`, 'INPUT_ENV_NOT_SET')
			}
			return value
		}
		case 'stdin':
			return await (dependencies.readStdin ?? readStdinText)()
	}
}

const readEnvironment = (name: string): string | undefined => process.env[name]

const removeOneTrailingLineEnding = (value: string): string => value.replace(/(?:\r\n|\n)$/, '')

const inputError = (message: string, code: string): CliError => new CliError(message, { code, exitCode: ExitCode.InputError })
