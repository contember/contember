import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Acl, Schema } from '@contember/schema'
import { Stage } from '../dtos/Stage'
import { AnyEvent, ContentEvent } from '@contember/engine-common'
import { formatSchemaName } from '../helpers/stageHelpers'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import Actions from '../authorization/Actions'
import { ProjectConfig } from '../../types'
import { Client } from '@contember/database'
import { isContentEvent } from '@contember/engine-common'
import { DatabaseContext } from '../database/DatabaseContext'
import { Identity } from '../authorization/Identity'

type PermissionsByRow = { [rowId: string]: boolean }
type PermissionsByTable = { [tableName: string]: PermissionsByRow }
type ContentEventsByTable = { [tableName: string]: ContentEvent[] }

interface Args {
	permissionContext: {
		projectRoles: string[]
		variables: Acl.VariablesMap
	}
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
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly authorizator: Authorizator,
		private readonly contentPermissionVerifier: ContentPermissionVerifier,
	) {}

	public async verify(
		db: DatabaseContext,
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

		return this.verifyPermissions(db, permissionContext, sourceStage, targetStage, events)
	}

	private async verifyPermissions(
		db: DatabaseContext,
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
			projectRoles: await context.identity.projectRoles,
			variables: context.variables,
		}
		const sourceSchema = await this.schemaVersionBuilder.buildSchemaForStage(db, sourceStage.slug)
		const readPermissions = await this.contentPermissionVerifier.verifyReadPermissions({
			db: db.client.forSchema(formatSchemaName(sourceStage)),
			eventsByTable,
			schema: sourceSchema,
			permissionContext,
		})
		const targetSchema = await this.schemaVersionBuilder.buildSchemaForStage(db, targetStage.slug)
		const writePermissions = await this.contentPermissionVerifier.verifyWritePermissions({
			db: db.client.forSchema(formatSchemaName(targetStage)),
			eventsByTable,
			schema: targetSchema,
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
