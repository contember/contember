/// <reference path="../../../../types/chalk-table/index.d.ts" />

import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import type { AuthLogFilter } from '@contember/graphql-client-tenant'
import chalkTable from 'chalk-table'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantAuthLogEntry } from '../../../lib/tenant/clients/index.js'
import { GRAPHQL_INT_MAX, parsePaginationLimit, parsePaginationOffset } from '../../../lib/tenant/input/index.js'
import { inputError } from './policyInput.js'
import { humanText } from '../tenantOutput.js'

type Args = {}

type Options = {
	type?: string[]
	success?: boolean
	failed?: boolean
	['invoked-by']?: string
	person?: string
	['target-person']?: string
	['person-input']?: string
	['created-after']?: string
	['created-before']?: string
	limit?: string
	offset?: string
}

/** The command's answer: the page plus everything a script needs to fetch the next one. */
export interface AuthLogPageResult {
	entries: TenantAuthLogEntry[]
	/** True when rows exist past this page. */
	hasMore: boolean
	offset: number
	/** Offset to pass to the next call, `null` when this is the last page. */
	nextOffset: number | null
}

export class TenantAuthLogCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Read the tenant auth log (audit trail). Requires the system:viewAuthLog permission.')
		configuration.option('type').valueArray().description('Filter by auth_log_type, e.g. sign_in. Repeat the option to match any of several types.')
		configuration.option('success').valueNone().description('Only successful entries.')
		configuration.option('failed').valueNone().description('Only failed entries.')
		configuration.option('invoked-by').valueRequired().description('Filter by the acting identity id.')
		configuration.option('person').valueRequired().description('Filter by the acting person id.')
		configuration.option('target-person').valueRequired().description('Filter by the person the action was performed on.')
		configuration.option('person-input').valueRequired().description('Filter by the submitted identifier, typically the e-mail of a failed sign-in.')
		configuration.option('created-after').valueRequired().description('Inclusive lower bound on createdAt, as an ISO 8601 timestamp.')
		configuration.option('created-before').valueRequired().description('Exclusive upper bound on createdAt, as an ISO 8601 timestamp.')
		configuration.option('limit').valueRequired().description('Page size. Server default is 100, capped at 500.')
		configuration.option('offset').valueRequired().description('Number of entries to skip. Use the nextOffset of the previous page.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const limit = parsePaginationLimit(input.getOption('limit'))
		const offset = parsePaginationOffset(input.getOption('offset')) ?? 0
		const filter = this.readFilter(input)

		const page = await this.tenantClientProvider.policy().readAuthLog({
			filter: Object.values(filter).some(it => it !== undefined) ? filter : undefined,
			limit,
			offset,
		})

		const advancedOffset = offset + page.entries.length
		const canContinue = page.hasMore && page.entries.length > 0 && advancedOffset <= GRAPHQL_INT_MAX
		const result: AuthLogPageResult = {
			entries: page.entries,
			hasMore: canContinue,
			offset,
			nextOffset: canContinue ? advancedOffset : null,
		}
		output.info(`authLog: ${page.entries.length} entries from offset ${offset}${result.hasMore ? ', more available' : ''}`)
		output.data(result, { human: renderHuman, quiet: value => value.entries.map(entry => entry.id) })
	}

	private readFilter(input: Input<Args, Options>): AuthLogFilter {
		const successOnly = input.getOption('success') === true
		const failedOnly = input.getOption('failed') === true
		if (successOnly && failedOnly) {
			throw inputError('Pass either --success or --failed, not both.', 'AMBIGUOUS_INPUT')
		}
		return {
			types: input.getOption('type'),
			success: successOnly ? true : failedOnly ? false : undefined,
			invokedByIdentityId: input.getOption('invoked-by'),
			personId: input.getOption('person'),
			targetPersonId: input.getOption('target-person'),
			personInputIdentifier: input.getOption('person-input'),
			createdAfter: input.getOption('created-after'),
			createdBefore: input.getOption('created-before'),
		}
	}
}

type AuthLogCell = 'createdAt' | 'type' | 'success' | 'person' | 'identity' | 'ip' | 'error'

// A curated, narrow projection: the full entry (metadata, eventData, user agent) stays in --json.
const humanColumns: { field: AuthLogCell; name: string }[] = [
	{ field: 'createdAt', name: 'Time (UTC)' },
	{ field: 'type', name: 'Type' },
	{ field: 'success', name: 'OK' },
	{ field: 'person', name: 'Person' },
	{ field: 'identity', name: 'Identity' },
	{ field: 'ip', name: 'IP' },
	{ field: 'error', name: 'Error' },
]

/**
 * `Output.data` renders the human view, because `Output.table` can only emit a bare array and the
 * paging fields have to stay in the `--json` payload. Formatting therefore lives here, human-only.
 */
const renderHuman = (page: AuthLogPageResult): string => {
	if (page.entries.length === 0) {
		return 'No auth log entries match the filter.'
	}
	const table = chalkTable({ columns: humanColumns }, page.entries.map(toHumanRow))
	return page.hasMore ? `${table}\nMore entries available — rerun with --offset ${page.nextOffset}.` : table
}

const toHumanRow = (entry: TenantAuthLogEntry): Record<AuthLogCell, string> => ({
	createdAt: formatTimestamp(entry.createdAt),
	type: humanText(entry.type),
	success: entry.success ? 'yes' : 'no',
	person: humanText(entry.personId ?? entry.personInputIdentifier ?? ''),
	identity: humanText(entry.invokedByIdentityId ?? ''),
	ip: humanText(entry.ipAddress ?? ''),
	error: humanText(entry.errorCode ?? ''),
})

/** Raw ISO timestamps read badly in a terminal; UTC keeps the rendering reproducible. */
const formatTimestamp = (value: string): string => {
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? humanText(value) : parsed.toISOString().replace('T', ' ').slice(0, 19)
}
