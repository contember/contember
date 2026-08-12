import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { PersonsFilter } from '@contember/graphql-client-tenant'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantPerson } from '../../../lib/tenant/clients/TenantPersonClient.js'
import { parsePaginationLimit, parsePaginationOffset } from '../../../lib/tenant/input/pagination.js'

type Args = {}

type Options = {
	email?: string
	['person-id']?: string
	['identity-id']?: string
	limit?: string
	offset?: string
}

export class TenantPersonListCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(
			'List persons. A SUPER_ADMIN sees everyone, anyone else only the members of projects they may view members of.',
		)
		configuration.option('email').valueRequired().description('Filter by e-mail address (case-insensitive, exact match).')
		configuration.option('person-id').valueRequired().description('Filter by person id.')
		configuration.option('identity-id').valueRequired().description('Filter by identity id.')
		configuration.option('limit').valueRequired().description(
			'Page size. The server caps it (default 100, max 1000) — this command never paginates behind your back.',
		)
		configuration.option('offset').valueRequired().description('Number of persons to skip. Combine with --limit to page through the list.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const filter: PersonsFilter = {
			email: input.getOption('email'),
			personId: input.getOption('person-id'),
			identityId: input.getOption('identity-id'),
		}
		const hasFilter = filter.email !== undefined || filter.personId !== undefined || filter.identityId !== undefined

		const persons = await this.tenantClientProvider.person().listPersons({
			filter: hasFilter ? filter : undefined,
			limit: parsePaginationLimit(input.getOption('limit')),
			offset: parsePaginationOffset(input.getOption('offset')),
		})

		if (persons.length === 0) {
			output.info('No persons matched.')
		}
		output.table<TenantPerson>(
			[
				{ field: 'id', name: 'ID' },
				{ field: 'email', name: 'E-mail' },
				{ field: 'name', name: 'Name' },
				{ field: 'identityId', name: 'Identity' },
				{ field: 'otpEnabled', name: 'TOTP' },
				{ field: 'emailOtpEnabled', name: 'E-mail OTP' },
				{ field: 'emailVerified', name: 'Verified' },
			],
			persons,
			'id',
		)
	}
}
