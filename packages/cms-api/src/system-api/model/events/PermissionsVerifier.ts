import { Authorizator, AuthorizationScope } from '@contember/authorization'
import { Stage } from '../dtos/Stage'
import { ContentEvent, AnyEvent } from '../dtos/Event'
import PredicateFactory from '../../../acl/PredicateFactory'
import { Client } from '@contember/database'
import { formatSchemaName } from '../helpers/stageHelpers'
import { ContentEvents, EventType, isContentEvent } from '../EventType'
import SchemaVersionBuilder from '../../../content-schema/SchemaVersionBuilder'
import { Acl, Model } from '@contember/schema'
import WhereBuilder from '../../../content-api/sql/select/WhereBuilder'
import Path from '../../../content-api/sql/select/Path'
import { getColumnName } from '@contember/schema-utils'
import JoinBuilder from '../../../content-api/sql/select/JoinBuilder'
import ConditionBuilder from '../../../content-api/sql/select/ConditionBuilder'
import PermissionsByIdentityFactory from '../../../acl/PermissionsByIdentityFactory'
import VariableInjector from '../../../acl/VariableInjector'
import Actions from '../authorization/Actions'
import { SelectBuilder } from '@contember/database'
import Project from '../../../config/Project'
import { Identity } from '@contember/engine-common'

type AffectedColumnsByRow = { [rowId: string]: string[] }
type PermissionsByRow = { [rowId: string]: boolean }
type PermissionsByTable = { [tableName: string]: PermissionsByRow }
type ContentEventsByTable = { [tableName: string]: ContentEvent[] }

class PermissionsVerifier {
	constructor(
		private readonly project: Project,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly db: Client,
		private readonly permissionsByIdentityFactory: PermissionsByIdentityFactory,
		private readonly authorizator: Authorizator,
	) {}

	public async verify(
		permissionContext: PermissionsVerifier.Context,
		sourceStage: Stage,
		targetStage: Stage,
		events: AnyEvent[],
	): Promise<PermissionsVerifier.Result> {
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
		context: PermissionsVerifier.Context,
		sourceStage: Stage,
		targetStage: Stage,
		events: AnyEvent[],
	): Promise<PermissionsVerifier.Result> {
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

		const readPermissions = await this.verifyPermissionsCb(
			context,
			sourceStage,
			eventsByTable,
			this.verifyReadPermissionsForTable.bind(this),
		)
		const writePermissions = await this.verifyPermissionsCb(
			context,
			targetStage,
			eventsByTable,
			this.verifyWritePermissionsForTable.bind(this),
		)

		const permissionsResult: PermissionsVerifier.Result = {}

		for (let event of events) {
			if (isContentEvent(event)) {
				const canRead = (readPermissions[event.tableName] || {})[event.rowId] || false
				const canWrite = (writePermissions[event.tableName] || {})[event.rowId] || false

				permissionsResult[event.id] =
					canRead && canWrite
						? PermissionsVerifier.EventPermission.canApply
						: canRead
						? PermissionsVerifier.EventPermission.canView
						: PermissionsVerifier.EventPermission.forbidden
			} else {
				permissionsResult[event.id] = PermissionsVerifier.EventPermission.forbidden
			}
		}

		return permissionsResult
	}

	private async verifyPermissionsCb(
		context: PermissionsVerifier.Context,
		stage: Stage,
		eventsByTable: ContentEventsByTable,
		cb: PermissionsVerifier['verifyReadPermissionsForTable'] | PermissionsVerifier['verifyWritePermissionsForTable'],
	): Promise<PermissionsByTable> {
		const db = this.db.forSchema(formatSchemaName(stage))
		const schema = await this.schemaVersionBuilder.buildSchemaForStage(stage.id)
		const { permissions } = this.permissionsByIdentityFactory.createPermissions(stage.slug, schema, {
			globalRoles: context.identity.roles,
			projectRoles: (await context.identity.getProjectRoles(this.project.slug)) || [],
		})

		const predicateFactory = new PredicateFactory(permissions, new VariableInjector(schema.model, context.variables))
		const entitiesByTable = Object.values(schema.model.entities).reduce<{ [tableName: string]: Model.Entity }>(
			(tables, entity) => ({ ...tables, [entity.tableName]: entity }),
			{},
		)
		const result: PermissionsByTable = {}
		for (let table in eventsByTable) {
			result[table] = await cb(schema.model, entitiesByTable[table], db, eventsByTable[table], predicateFactory)
		}
		return result
	}

	private groupEventsByTable(events: ContentEvent[]): ContentEventsByTable {
		return events.reduce<ContentEventsByTable>(
			(groups, event) => ({ ...groups, [event.tableName]: [...(groups[event.tableName] || []), event] }),
			{},
		)
	}

	private async verifyReadPermissionsForTable(
		schema: Model.Schema,
		entity: Model.Entity,
		db: Client,
		events: ContentEvent[],
		predicateFactory: PredicateFactory,
	): Promise<PermissionsByRow> {
		const rowAffectedColumns = this.getAffectedColumnsByRow(events)

		const ids = events.map(it => it.rowId)
		let qb: SelectBuilder<SelectBuilder.Result, any> = this.createBaseSelectBuilder(db, entity, ids)

		qb = this.buildPredicates(db, qb, Acl.Operation.read, rowAffectedColumns, entity, predicateFactory, schema)

		const result = await qb.getResult()
		const permissions: PermissionsByRow = {}
		for (let row of result) {
			permissions[row.__primary] = this.extractRowPermissions(row, rowAffectedColumns, Acl.Operation.read)
		}
		return permissions
	}

	private async verifyWritePermissionsForTable(
		schema: Model.Schema,
		entity: Model.Entity,
		db: Client,
		events: ContentEvent[],
		predicateFactory: PredicateFactory,
	): Promise<PermissionsByRow> {
		const ids = events.map(it => it.rowId)

		const affectedColumnsByType: { [type: string]: AffectedColumnsByRow } = {}
		let qb: SelectBuilder<SelectBuilder.Result, 'select' | 'from' | 'where' | 'join'> = this.createBaseSelectBuilder(
			db,
			entity,
			ids,
		)

		const eventToOperationMapping = {
			[EventType.create]: Acl.Operation.create,
			[EventType.update]: Acl.Operation.update,
			[EventType.delete]: Acl.Operation.delete,
		}
		for (const eventType of ContentEvents) {
			const typeEvents = events.filter(it => it.type === eventType)
			affectedColumnsByType[eventType] = this.getAffectedColumnsByRow(typeEvents)
			qb = this.buildPredicates(
				db,
				qb,
				eventToOperationMapping[eventType],
				affectedColumnsByType[eventType],
				entity,
				predicateFactory,
				schema,
			)
		}

		const result = await qb.getResult()
		const permissions: PermissionsByRow = {}
		for (let row of result) {
			let result = true
			for (const eventType of ContentEvents) {
				result =
					result &&
					this.extractRowPermissions(row, affectedColumnsByType[eventType], eventToOperationMapping[eventType])
			}

			permissions[row.__primary] = result
		}

		return permissions
	}

	private buildPredicates<Filled extends keyof SelectBuilder.Options>(
		db: Client,
		qb: SelectBuilder<SelectBuilder.Result, Filled>,
		operation: Acl.Operation,
		rowAffectedColumns: AffectedColumnsByRow,
		entity: Model.Entity,
		predicateFactory: PredicateFactory,
		schema: Model.Schema,
	) {
		const columnToField = Object.values(entity.fields).reduce<{ [column: string]: string }>(
			(result, field) => ({
				...result,
				[getColumnName(schema, entity, field.name)]: field.name,
			}),
			{},
		)

		const whereBuilder = new WhereBuilder(schema, new JoinBuilder(schema), new ConditionBuilder(), db)

		const columns = Object.values(rowAffectedColumns).reduce(
			(result, fields) => [...result, ...fields.filter(it => result.indexOf(it) < 0)],
			[],
		)

		let withPredicates: SelectBuilder<SelectBuilder.Result, Filled | 'select' | 'join'> = qb
		for (const column of columns) {
			const fieldPredicate =
				operation === Acl.Operation.delete
					? predicateFactory.create(entity, operation)
					: predicateFactory.create(entity, operation, [columnToField[column]])

			withPredicates = whereBuilder.buildAdvanced(entity, new Path([]), fieldPredicate, cb =>
				withPredicates.select(
					expr =>
						expr.selectCondition(condition => {
							cb(condition)
							if (condition.isEmpty()) {
								condition.raw('true')
							}
						}),
					this.formatPermissionColumn(column, operation),
				),
			)
		}

		return withPredicates
	}

	private createBaseSelectBuilder(db: Client, entity: Model.Entity, ids: string[]) {
		return db
			.selectBuilder()
			.select(entity.primaryColumn, '__primary')
			.from(entity.tableName, new Path([]).getAlias())
			.where(clause => clause.in(entity.primaryColumn, ids))
	}

	private getAffectedColumnsByRow(events: ContentEvent[]): AffectedColumnsByRow {
		return events.reduce<AffectedColumnsByRow>((result, event) => {
			const currentFields = result[event.rowId] || []
			const eventFields = event.type === EventType.delete ? ['id'] : Object.keys(event.values)

			const newFields = [...currentFields, ...eventFields.filter(it => currentFields.indexOf(it) < 0)]
			return { ...result, [event.rowId]: newFields }
		}, {})
	}

	private extractRowPermissions(
		row: { [column: string]: any },
		affectedColumnsByRow: AffectedColumnsByRow,
		operation: Acl.Operation,
	) {
		return affectedColumnsByRow[row.__primary].reduce(
			(acc, column) => acc && row[this.formatPermissionColumn(column, operation)],
			true,
		)
	}

	private formatPermissionColumn(columnName: string, operation: Acl.Operation) {
		return `${columnName}_${operation}`
	}
}

namespace PermissionsVerifier {
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

export default PermissionsVerifier
