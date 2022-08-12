import { Component } from '@contember/binding'
import { ReactNode } from 'react'
import { identityEnvironmentExtension } from './IdentityEnvironmentExtension'
import { useProjectUserRoles } from '../../acl'
import { projectEnvironmentExtension } from '../Project/ProjectEnvironmentExtension'

type RoleCondition = string | ((roles: Set<string>) => boolean);

export interface HasRoleProps {
	children?: ReactNode
	role: RoleCondition
}
export const HasRole = Component<HasRoleProps>(({ children, role }) => {
	const projectRoles = useProjectUserRoles()

	return evaluateCondition(role, projectRoles) ? <>{children}</> : null
}, ({ children, role }, env) => {
	const identity = env.getExtension(identityEnvironmentExtension).identity
	const project = env.getExtension(projectEnvironmentExtension).slug
	const projectRoles = new Set(identity?.projects.find(it => it.slug === project)?.roles ?? [])

	return evaluateCondition(role, projectRoles) ? <>{children}</> : null
})

const evaluateCondition = (condition: RoleCondition, roles: Set<string>) => {
	if (typeof condition === 'string') {
		return roles.has(condition)
	}
	return condition(roles)
}
