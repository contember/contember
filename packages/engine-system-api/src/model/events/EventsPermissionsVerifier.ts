import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Acl, Schema } from '@contember/schema'
import { formatSchemaName } from '../helpers/stageHelpers'
import { AnyEvent, ContentEvent, isContentEvent } from '@contember/engine-common'
import { Stage } from '../dtos'
import { AuthorizationActions } from '../authorization'
import { Client } from '@contember/database'
import { Identity } from '../authorization/Identity'
import { DatabaseContext } from '../database'
import { SchemaVersionBuilder } from '../migrations'
import { filterSchemaByStage } from '@contember/schema-utils'
import { getJunctionTables } from '../helpers/modelHelpers'
import assert from 'assert'

type PermissionsByRow = { [rowId: string]: boolean }
type PermissionsByTable = { [tableName: string]: PermissionsByRow }
type ContentEventsByTable = { [tableName: string]: ContentEvent[] }

interface Args {
	permissionContext: {
		roles: string[]
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

export class EventsPermissionsVerifier {
	constructor(
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly authorizator: Authorizator,
		private readonly contentPermissionVerifier: ContentPermissionVerifier,
	) {}

	public async verify(
		db: DatabaseContext,
		permissionContext: EventsPermissionsVerifierContext,
		sourceStage: Stage,
		targetStage: Stage,
		events: AnyEvent[],
	): Promise<EventsPermissionsVerifierResult> {
		const isAllowed = await this.authorizator.isAllowed(
			permissionContext.identity,
			new AuthorizationScope.Global(),
			AuthorizationActions.PROJECT_RELEASE_ANY,
		)
		return events
			.map(it => it.id)
			.reduce<EventsPermissionsVerifierResult>(
				(acc, id) => ({ ...acc, [id]: isAllowed ? EventPermission.canApply : EventPermission.forbidden }),
				{},
			)

		// return this.verifyPermissions(db, permissionContext, sourceStage, targetStage, events)
	}

	private async verifyPermissions(
		db: DatabaseContext,
		context: EventsPermissionsVerifierContext,
		sourceStage: Stage,
		targetStage: Stage,
		events: AnyEvent[],
	): Promise<EventsPermissionsVerifierResult> {
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
			roles: await context.identity.roles,
			variables: context.variables,
		}
		const schema = await this.schemaVersionBuilder.buildSchema(db)
		const sourceSchema = filterSchemaByStage(schema, sourceStage.slug)
		const readPermissions = await this.contentPermissionVerifier.verifyReadPermissions({
			db: db.client.forSchema(formatSchemaName(sourceStage)),
			eventsByTable,
			schema: sourceSchema,
			permissionContext,
		})
		const targetSchema = filterSchemaByStage(schema, targetStage.slug)
		const writePermissions = await this.contentPermissionVerifier.verifyWritePermissions({
			db: db.client.forSchema(formatSchemaName(targetStage)),
			eventsByTable,
			schema: targetSchema,
			permissionContext,
		})

		const permissionsResult: EventsPermissionsVerifierResult = {}

		const junctionTables = new Set(getJunctionTables(schema.model).map(it => it.tableName))
		for (let event of events) {
			if (isContentEvent(event)) {
				if (junctionTables.has(event.tableName)) {
					// fixme!
					permissionsResult[event.id] = EventPermission.canApply
				} else {
					assert.equal(event.rowId.length, 1)
					const canRead = (readPermissions[event.tableName] || {})[event.rowId[0]] || false
					const canWrite = (writePermissions[event.tableName] || {})[event.rowId[0]] || false

					permissionsResult[event.id] =
						canRead && canWrite
							? EventPermission.canApply
							: canRead
							? EventPermission.canView
							: EventPermission.forbidden
				}
			} else {
				permissionsResult[event.id] = EventPermission.forbidden
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

export type EventsPermissionsVerifierResult = { [eventId: string]: EventPermission }

export type EventsPermissionsVerifierContext = {
	variables: Acl.VariablesMap
	identity: Identity
}

export enum EventPermission {
	forbidden = 'forbidden',
	canView = 'canView',
	canApply = 'canApply',
}
