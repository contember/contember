import { Component } from '@contember/react-binding'
import { ReactNode } from 'react'
import { useProjectUserRoles } from '../hooks'
import { identityEnvironmentExtension, projectEnvironmentExtension } from '../environment'

/**
 * Defines the different ways to specify role conditions for the HasRole component.
 *
 * #### Example: Single role
 * ```ts
 * 'admin'
 *```
 *
 * #### Example: Multiple roles (OR logic) - user needs ANY of these roles
 * ```ts
 * ['admin', 'developer', 'lead']
 *```
 *
 * #### Example: Explicit OR logic
 * ```ts
 * { any: ['admin', 'developer'] }
 *```
 *
 * #### Example: AND logic - user needs ALL of these roles
 * ```ts
 * { all: ['admin', 'developer'] }
 *```
 *
 * #### Example: Exclude roles - user must NOT have these roles
 * ```ts
 * { not: 'guest' }
 * { not: ['guest', 'banned'] }
 *```
 *
 * #### Example: Custom function for complex logic
 * ```ts
 * (roles) => roles.has('admin') && roles.size > 1
 *```
 *
 */
export type RoleCondition =
	| string
	| string[]
	| { any: string[] }
	| { all: string[] }
	| { not: string | string[] }
	| ((roles: Set<string>) => boolean)

/**
 * Evaluates whether the given role condition is satisfied by the provided set of roles.
 *
 * The function handles different types of role conditions:
 * - String: Checks if the role exists in the set
 * - Array: Checks if any of the roles exist in the set (OR logic)
 * - Function: Executes the custom function with the roles set
 * - Object with 'any': Checks if any of the specified roles exist (OR logic)
 * - Object with 'all': Checks if all of the specified roles exist (AND logic)
 * - Object with 'not': Checks that the specified role(s) do not exist
 *
 * #### Example: Check if user has admin role
 * ```ts
 * evaluateRoleCondition('admin', userRoles)
 *```
 * #### Example: Check if user has any of the specified roles
 * ```ts
 * evaluateRoleCondition(['admin', 'editor'], userRoles)
 *```
 *
 * #### Example: Check if user has all of the specified roles
 * ```ts
 * evaluateRoleCondition({ all: ['admin', 'developer'] }, userRoles)
 *```
 *
 * #### Example: Check if user does not have any of the specified roles
 * ```ts
 * evaluateRoleCondition({ not: ['admin', 'editor'] }, userRoles)
 *```
 */
export const evaluateRoleCondition = (condition: RoleCondition, roles: Set<string>): boolean => {
	if (typeof condition === 'string') {
		return roles.has(condition)
	}

	if (Array.isArray(condition)) {
		return condition.some(role => roles.has(role))
	}

	if (typeof condition === 'function') {
		return condition(roles)
	}

	if (typeof condition === 'object' && condition !== null) {
		if ('any' in condition) {
			return condition.any.some(role => roles.has(role))
		}

		if ('all' in condition) {
			return condition.all.every(role => roles.has(role))
		}

		if ('not' in condition) {
			if (typeof condition.not === 'string') {
				return !roles.has(condition.not)
			}
			if (Array.isArray(condition.not)) {
				return !condition.not.some(role => roles.has(role))
			}
		}
	}

	return false
}

export interface HasRoleProps {
	children?: ReactNode
	role: RoleCondition
}

/**
 * Props {@link HasRoleProps}
 *
 * `HasRole` conditionally renders children based on the current user's roles in the project.
 *
 * Supports complex role conditions using strings, arrays, logical structures (`any`, `all`, `not`), or a custom predicate function.
 *
 * #### Example: Show content only to admins
 * ```tsx
 * <HasRole role="admin">
 *   <AdminPanel />
 * </HasRole>
 * ```
 *
 * #### Example: Show content to multiple roles (OR logic)
 * ```tsx
 * <HasRole role={['admin', 'developer', 'lead']}>
 *   <DeveloperTools />
 * </HasRole>
 * ```
 *
 * #### Example: Show content only if user has ALL specified roles
 * ```tsx
 * <HasRole role={{ all: ['admin', 'developer'] }}>
 *   <SuperUserPanel />
 * </HasRole>
 * ```
 *
 * #### Example: Show content to everyone except guests
 * ```tsx
 * <HasRole role={{ not: 'guest' }}>
 *   <AuthenticatedContent />
 * </HasRole>
 * ```
 *
 * #### Example: Custom logic for complex conditions
 * ```tsx
 * <HasRole role={(roles) => roles.has('admin') || (roles.has('developer') && roles.has('lead'))}>
 *   <ComplexPermissionContent />
 * </HasRole>
 * ```
 *
 * @group Logic Components
 */
export const HasRole = Component<HasRoleProps>(({ children, role }) => {
	const projectRoles = useProjectUserRoles()

	return evaluateRoleCondition(role, projectRoles) ? <>{children}</> : null
}, ({ children, role }, env) => {
	const identity = env.getExtension(identityEnvironmentExtension).identity
	const project = env.getExtension(projectEnvironmentExtension).slug
	const projectRoles = new Set(identity?.projects.find(it => it.slug === project)?.roles ?? [])

	return evaluateRoleCondition(role, projectRoles) ? <>{children}</> : null
})
