import { FC } from 'react'
import { RoleRenderer, Variables } from './RoleRenderer'
import { Tag } from '@contember/ui'
import { Membership } from '../../types'

export interface IdentityMembershipProps {
	RoleRenderer: RoleRenderer
	memberships: Membership[]
}

/**
 * @group Tenant
 */
export const IdentityMembership: FC<IdentityMembershipProps> = ({ RoleRenderer, memberships }) => {
	return (
		<>
			{memberships.map((membership, i) => {
				const vars: Variables = {}
				for (let variable of membership.variables) {
					vars[variable.name] = variable.values
				}
				return (
					<Tag key={membership.role}>
						<RoleRenderer variables={vars} role={membership.role} />
					</Tag>
				)
			})}
		</>
	)
}
