import { Button, ContainerSpinner, Table, TableCell, TableRow } from '@contember/ui'
import { ComponentType, memo } from 'react'
import { EmptyMessage } from '../../../components'
import { ListMembersMemberType, MemberIdentity, useListMembersQuery } from '../../queries'
import { RoutingLinkTarget, LinkButton } from '../../../routing'
import { RoleRendererFactory, useRoleRenderer } from './RoleRenderer'
import { useRemoveMemberIntent } from './useRemoveMemberIntent'
import { IdentityMembership } from './IdentityMembership'
import { QueryLoader } from '../QueryLoader'

export interface MemberListProps {
	project: string
	children?: undefined
	createRoleRenderer?: RoleRendererFactory
	memberType: ListMembersMemberType
	Identity: ComponentType<{ identity: MemberIdentity }>
	editIdentityLink: RoutingLinkTarget
}

/**
 * @group Tenant
 */
export const MemberList = memo<MemberListProps>(({ project, createRoleRenderer, editIdentityLink, Identity, memberType }) => {
		const { state: query, refetch: refetchMembersList } = useListMembersQuery(project, memberType)
		const removeMember = useRemoveMemberIntent(project, refetchMembersList)
		const RoleRenderer = useRoleRenderer(createRoleRenderer, query)

		return (
			<QueryLoader query={query}>
				{({ query }) => {
					if (!RoleRenderer) {
						return <ContainerSpinner />
					}

					if (query.data.project.members.length === 0) {
						return <EmptyMessage>No members</EmptyMessage>
					}

					return (
						<Table bare>
							{query.data.project.members.map(member => {
								return (
									<TableRow key={member.identity.id}>
										<TableCell>
											<Identity identity={member.identity} />
										</TableCell>
										<TableCell>
											<IdentityMembership RoleRenderer={RoleRenderer} memberships={member.memberships} />
										</TableCell>
										<TableCell shrunk>
											<LinkButton size="small" to={editIdentityLink} parameters={{ identityId: member.identity.id, projectSlug: project }}>
												Edit roles
											</LinkButton>
										</TableCell>
										<TableCell shrunk>
											<Button size="small" intent="danger" onClick={() => removeMember(member.identity.id)}>
												Revoke access
											</Button>
										</TableCell>
									</TableRow>
								)
							})}
						</Table>
					)
				}}
			</QueryLoader>
		)
	},
)
