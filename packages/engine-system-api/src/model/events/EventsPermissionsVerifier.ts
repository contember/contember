import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Acl, Schema } from '@contember/schema'
import { Identity } from '@contember/engine-common'
import { Stage } from '../dtos/Stage'
import { AnyEvent, ContentEvent } from '../dtos/Event'
import { formatSchemaName } from '../helpers/stageHelpers'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import Actions from '../authorization/Actions'
import { ProjectConfig } from '../../types'
import { Client } from '@contember/database'
import { isContentEvent } from '../EventType'

type PermissionsByRow = { [rowId: string]: boolean }
type PermissionsByTable = { [tableName: string]: PermissionsByRow }
type ContentEventsByTable = { [tableName: string]: ContentEvent[] }

interface Args {
	permissionContext: {
		globalRoles: string[]
		projectRoles: string[]
		variables: Acl.VariablesMap
	}
	stageSlug: string
	db: Client
	schema: Schema
	eventsByTable: ContentEventsByTable
}

export interface ContentPermissionVerifier {
	verifyReadPermissions(args: Args): Promise<PermissionsByTable>

	verifyWritePermissions(args: Args): Promise<PermissionsByTable>
}

class EventsPermissionsVerifier {
	constructor(
		private readonly project: ProjectConfig,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly db: Client,
		private readonly authorizator: Authorizator,
		private readonly contentPermissionVerifier: ContentPermissionVerifier,
	) {}

	public async verify(
		permissionContext: EventsPermissionsVerifier.Context,
		sourceStage: Stage,
		targetStage: Stage,
		events: AnyEvent[],
	): Promise<EventsPermissionsVerifier.Result> {
		if (
			await this.authorizator.isAllowed(
				permissionContext.identity,
				new AuthorizationScope.Global(),
				Actions.PROJECT_RELEASE_ANY,
			)
		) {
			return events.map(it => it.id).reduce((acc, id) => ({ ...acc, [id]: true }), {})
		}

		return this.verifyPermissions(permissionContext, sourceStage, targetStage, events)
	}

	public async verifyPermissions(
		context: EventsPermissionsVerifier.Context,
		sourceStage: Stage,
		targetStage: Stage,
		events: AnyEvent[],
	): Promise<EventsPermissionsVerifier.Result> {
		const contentEvents: ContentEvent[] = []

		for (const event of events) {
			if (isContentEvent(event)) {
				contentEvents.push(event)
			} else {
				// if there is migration, we cannot verify any further content event permissions
				break
			}
		}

		const eventsByTable = this.groupEventsByTable(contentEvents)

		const permissionContext = {
			globalRoles: context.identity.roles,
			projectRoles: await context.identity.getProjectRoles(this.project.slug),
			variables: context.variables,
		}
		const readPermissions = await this.contentPermissionVerifier.verifyReadPermissions({
			db: this.db.forSchema(formatSchemaName(sourceStage)),
			eventsByTable,
			schema: await this.schemaVersionBuilder.buildSchemaForStage(sourceStage.slug),
			stageSlug: sourceStage.slug,
			permissionContext,
		})
		const writePermissions = await this.contentPermissionVerifier.verifyWritePermissions({
			db: this.db.forSchema(formatSchemaName(targetStage)),
			eventsByTable,
			schema: await this.schemaVersionBuilder.buildSchemaForStage(targetStage.slug),
			stageSlug: targetStage.slug,
			permissionContext,
		})

		const permissionsResult: EventsPermissionsVerifier.Result = {}

		for (let event of events) {
			if (isContentEvent(event)) {
				const canRead = (readPermissions[event.tableName] || {})[event.rowId] || false
				const canWrite = (writePermissions[event.tableName] || {})[event.rowId] || false

				permissionsResult[event.id] =
					canRead && canWrite
						? EventsPermissionsVerifier.EventPermission.canApply
						: canRead
						? EventsPermissionsVerifier.EventPermission.canView
						: EventsPermissionsVerifier.EventPermission.forbidden
			} else {
				permissionsResult[event.id] = EventsPermissionsVerifier.EventPermission.forbidden
			}
		}

		return permissionsResult
	}

	private groupEventsByTable(events: ContentEvent[]): ContentEventsByTable {
		return events.reduce<ContentEventsByTable>(
			(groups, event) => ({ ...groups, [event.tableName]: [...(groups[event.tableName] || []), event] }),
			{},
		)
	}
}

namespace EventsPermissionsVerifier {
	export type Result = { [eventId: string]: EventPermission }

	export type Context = {
		variables: Acl.VariablesMap
		identity: Identity
	}

	export enum EventPermission {
		forbidden = 'forbidden',
		canView = 'canView',
		canApply = 'canApply',
	}
}

export { EventsPermissionsVerifier }
