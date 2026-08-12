import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import type { MemberType } from '@contember/graphql-client-tenant'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import type { TenantProjectMember } from '../../../lib/tenant/clients/index.js'
import { parsePaginationLimit, parsePaginationOffset } from '../../../lib/tenant/input/pagination.js'
import { formatMemberships, requireOptionValue } from './memberOptions.js'

type Args = {}

type Options = {
	project?: string
	identity?: string[]
	email?: string[]
	person?: string[]
	type?: string
	limit?: string
	offset?: string
}

const memberTypes: MemberType[] = ['PERSON', 'API_KEY']

/** `tenant member list` */
export class TenantMemberListCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('List the members of a project with their memberships')
		configuration.option('project').valueRequired().required().description('Project slug.')
		configuration.option('identity').valueArray().description('Filter by identity id. Repeat for several ids.')
		configuration.option('email').valueArray().description('Filter by e-mail. Repeat for several addresses.')
		configuration.option('person').valueArray().description('Filter by person id. Repeat for several ids.')
		configuration.option('type').valueRequired().description(`Filter by member type: ${memberTypes.join(' or ')}.`)
		configuration.option('limit').valueRequired().description('Maximum number of members to return.')
		configuration.option('offset').valueRequired().description('Number of members to skip.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const projectSlug = requireOptionValue(input.getOption('project'), 'project')
		const members = await this.tenantClientProvider.member().listProjectMembers(projectSlug, {
			filter: {
				identityId: input.getOption('identity'),
				email: input.getOption('email'),
				personId: input.getOption('person'),
				memberType: parseMemberType(input.getOption('type')),
			},
			limit: parsePaginationLimit(input.getOption('limit')),
			offset: parsePaginationOffset(input.getOption('offset')),
		})

		output.table<TenantProjectMember>(
			[
				{ field: 'identityId', name: 'Identity' },
				{ field: 'email', name: 'E-mail' },
				{ field: 'name', name: 'Name' },
				{ field: 'description', name: 'Description' },
				{ field: 'memberships', name: 'Memberships', format: formatMemberships },
			],
			members,
			'identityId',
		)

		if (members.length === 0) {
			// the tenant API returns an empty list instead of an error when the token may not see members
			output.info(`No members found in project ${projectSlug}. The token may also lack the "project.view members" permission.`)
		}
	}
}

const parseMemberType = (value: string | undefined): MemberType | undefined => {
	if (value === undefined) {
		return undefined
	}
	const memberType = memberTypes.find(it => it === value.toUpperCase())
	if (memberType === undefined) {
		throw new CliError(`Option --type must be one of ${memberTypes.join(', ')}, got "${value}".`, {
			code: 'INVALID_INPUT',
			exitCode: ExitCode.InputError,
		})
	}
	return memberType
}
