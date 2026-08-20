import { CliError, ExitCode } from '@contember/cli-common'

/** GraphQL `Int` is a signed 32-bit integer. Pagination values are non-negative. */
export const GRAPHQL_INT_MAX = 2_147_483_647

/** Parses an optional non-negative integer pagination offset. */
export const parsePaginationOffset = (value: string | undefined, flag = '--offset'): number | undefined =>
	parsePaginationInteger(value, flag, 'offset', 0)

/** Parses an optional positive integer pagination limit. */
export const parsePaginationLimit = (value: string | undefined, flag = '--limit'): number | undefined =>
	parsePaginationInteger(value, flag, 'limit', 1)

const parsePaginationInteger = (
	value: string | undefined,
	flag: string,
	kind: 'offset' | 'limit',
	minimum: number,
): number | undefined => {
	if (value === undefined) {
		return undefined
	}
	const parsed = Number(value)
	if (
		!/^(?:0|[1-9]\d*)$/.test(value)
		|| !Number.isSafeInteger(parsed)
		|| parsed < minimum
		|| parsed > GRAPHQL_INT_MAX
	) {
		const requirement = kind === 'offset'
			? `a non-negative GraphQL Int (maximum ${GRAPHQL_INT_MAX})`
			: `a positive GraphQL Int (maximum ${GRAPHQL_INT_MAX})`
		throw new CliError(`${flag} must be ${requirement}.`, {
			code: kind === 'offset' ? 'INVALID_PAGINATION_OFFSET' : 'INVALID_PAGINATION_LIMIT',
			exitCode: ExitCode.InputError,
		})
	}
	return parsed
}
