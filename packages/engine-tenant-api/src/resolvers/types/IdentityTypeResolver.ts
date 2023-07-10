import {
	Identity,
	IdentityGlobalPermissions,
	IdentityProjectRelation,
	IdentityResolvers,
	Maybe,
	Person,
} from '../../schema'
import {
	IdentityQuery,
	PermissionActions,
	PermissionContextFactory,
	PersonByIdentityBatchQuery,
	PersonRow,
	ProjectManager,
	ProjectMemberManager,
} from '../../model'
import { TenantResolverContext } from '../TenantResolverContext'
import { notEmpty } from '../../utils/array'
import { batchLoader } from '../../utils/batchQuery'
import { PersonResponseFactory } from '../responseHelpers/PersonResponseFactory'

export class IdentityTypeResolver implements IdentityResolvers {
	private personLoader = batchLoader<string, Record<string, PersonRow>, PersonRow>(
		async (ids, db) => {
			const persons = await db.queryHandler.fetch(new PersonByIdentityBatchQuery(ids))
			return Object.fromEntries(persons.map(it => [it.identity_id, it]))
		},
		(id, result) => result[id],
	)
	private rolesLoader = batchLoader<string, Record<string, string[]>, string[]>(
		async (ids, db) => {
			const identities = await db.queryHandler.fetch(new IdentityQuery(ids))
			return Object.fromEntries(identities.map(it => [it.id, it.roles]))
		},
		(id, result) => result[id] ?? [],
	)

	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
		private readonly permissionContextFactory: PermissionContextFactory,
	) {
	}

	async person(parent: Identity, args: unknown, context: TenantResolverContext): Promise<Maybe<Person>> {
		const person = await context.db.batchLoad(this.personLoader, parent.id)
		if (!person) {
			return null
		}
		return {
			...PersonResponseFactory.createPersonResponse(person),
			identity: parent,
		}
	}

	async projects(
		parent: { id: string; projects: readonly IdentityProjectRelation[] },
		{}: any,
		context: TenantResolverContext,
	): Promise<readonly IdentityProjectRelation[]> {
		if (parent.projects.length > 0) {
			return parent.projects
		}
		const isSelf = parent.id === context.identity.id
		const roles = isSelf ? context.identity.roles : []
		const projects = await this.projectManager.getProjectsByIdentity(context.db, parent.id, context.permissionContext)
		return (
			await Promise.all(
				projects.map(async (it): Promise<IdentityProjectRelation | null> => {
					const verifier = isSelf
						? undefined
						: context.permissionContext.createAccessVerifier(await context.permissionContext.createProjectScope(it))
					const memberships = await this.projectMemberManager.getAllProjectMemberships(
						context.db,
						{ id: it.id },
						{ id: parent.id, roles },
						verifier,
					)
					if (memberships.length === 0) {
						return null
					}
					return {
						project: { ...it, members: [], roles: [] },
						memberships: memberships,
					}
				}),
			)
		).filter(notEmpty)
	}

	async roles(
		parent: { id: string; roles?: readonly string[] | undefined | null },
		{}: any,
		context: TenantResolverContext,
	): Promise<readonly string[] | null> {
		if (parent.roles) {
			return parent.roles
		}
		const isSelf = parent.id === context.identity.id
		if (isSelf) {
			return context.identity.roles
		}
		const canViewRoles = await context.permissionContext.isAllowed({ action: PermissionActions.IDENTITY_VIEW_PERMISSIONS })
		if (canViewRoles) {
			return await context.db.batchLoad(this.rolesLoader, parent.id)
		} else {
			return null
		}
	}

	async permissions(
		parent: { id: string; permissions?: IdentityGlobalPermissions | undefined | null; roles?: readonly string[] | undefined | null },
		{}: any,
		context: TenantResolverContext,
	): Promise<IdentityGlobalPermissions | null> {
		if (parent.permissions) {
			return parent.permissions
		}

		const permissionsContext = await (async () => {
			const isSelf = parent.id === context.identity.id
			if (isSelf) {
				return context.permissionContext
			}
			const roles = await this.roles(parent, {}, context)
			if (roles === null) {
				return null
			}
			return this.permissionContextFactory.create(context.db, { id: parent.id, roles })
		})()

		if (!permissionsContext) {
			return null
		}

		return {
			canCreateProject: await permissionsContext.isAllowed({ action: PermissionActions.PROJECT_CREATE }),
			canDeployEntrypoint: await permissionsContext.isAllowed({ action: PermissionActions.ENTRYPOINT_DEPLOY }),
		}
	}
}
