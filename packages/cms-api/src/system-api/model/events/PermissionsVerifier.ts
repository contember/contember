import { Stage } from '../dtos/Stage'
import { ContentEvent, Event } from '../dtos/Event'
import PredicateFactory from '../../../acl/PredicateFactory'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { formatSchemaName } from '../helpers/stageHelpers'
import { ContentEvents, EventType } from '../EventType'
import SchemaVersionBuilder from '../../../content-schema/SchemaVersionBuilder'
import { Acl, Model } from 'cms-common'
import WhereBuilder from '../../../content-api/sql/select/WhereBuilder'
import Path from '../../../content-api/sql/select/Path'
import { getColumnName } from '../../../content-schema/modelUtils'
import JoinBuilder from '../../../content-api/sql/select/JoinBuilder'
import ConditionBuilder from '../../../content-api/sql/select/ConditionBuilder'
import PermissionsByIdentityFactory from '../../../acl/PermissionsByIdentityFactory'
import VariableInjector from '../../../acl/VariableInjector'
import Authorizator from '../../../core/authorization/Authorizator'
import AuthorizationScope from '../../../core/authorization/AuthorizationScope'
import Actions from '../authorization/Actions'
import SelectBuilder from '../../../core/knex/SelectBuilder'
import Project from '../../../config/Project'
import Identity from '../../../common/auth/Identity'

type AffectedColumnsByRow = { [rowId: string]: string[] }
type PermissionsByRow = { [rowId: string]: boolean }
type PermissionsByTable = { [tableName: string]: PermissionsByRow }
type ContentEventsByTable = { [tableName: string]: ContentEvent[] }

class PermissionsVerifier {
	constructor(
		private readonly project: Project,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly db: KnexWrapper,
		private readonly permissionsByIdentityFactory: PermissionsByIdentityFactory,
		private readonly authorizator: Authorizator
	) {}

	public async verify(
		permissionContext: PermissionsVerifier.Context,
		sourceStage: Stage,
		targetStage: Stage,
		events: Event[]
	): Promise<PermissionsVerifier.Result> {
		if (
			await this.authorizator.isAllowed(
				permissionContext.identity,
				new AuthorizationScope.Global(),
				Actions.PROJECT_RELEASE_ANY
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
		events: Event[]
	): Promise<PermissionsVerifier.Result> {
		const contentEvents = events.filter(this.isContentEvent)
		const eventsByTable = this.groupEventsByTable(contentEvents)

		const readPermissions = await this.verifyPermissionsCb(
			context,
			sourceStage,
			eventsByTable,
			this.verifyReadPermissionsForTable.bind(this)
		)
		const writePermissions = await this.verifyPermissionsCb(
			context,
			targetStage,
			eventsByTable,
			this.verifyWritePermissionsForTable.bind(this)
		)

		const permissionsResult: PermissionsVerifier.Result = {}

		for (let event of events) {
			if (this.isContentEvent(event)) {
				const canRead = readPermissions[event.tableName][event.rowId]
				const canWrite = writePermissions[event.tableName][event.rowId]

				permissionsResult[event.id] = canRead && canWrite ? PermissionsVerifier.EventPermission.canApply
					: (canRead ? PermissionsVerifier.EventPermission.canView : PermissionsVerifier.EventPermission.forbidden)

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
		cb: PermissionsVerifier['verifyReadPermissionsForTable'] | PermissionsVerifier['verifyWritePermissionsForTable']
	): Promise<PermissionsByTable> {
		const db = this.db.forSchema(formatSchemaName(stage))
		const schema = await this.schemaVersionBuilder.buildSchemaForStage(stage.id)
		const { permissions } = this.permissionsByIdentityFactory.createPermissions(
			{ model: schema, acl: context.acl },
			{
				globalRoles: context.identity.roles,
				projectRoles: await context.identity.getProjectRoles(this.project.uuid) || [],
			}
		)

		const predicateFactory = new PredicateFactory(permissions, new VariableInjector(schema, context.variables))
		const entitiesByTable = Object.values(schema.entities).reduce<{ [tableName: string]: Model.Entity }>(
			(tables, entity) => ({ ...tables, [entity.tableName]: entity }),
			{}
		)
		const result: PermissionsByTable = {}
		for (let table in eventsByTable) {
			result[table] = await cb(schema, entitiesByTable[table], db, eventsByTable[table], predicateFactory)
		}
		return result
	}

	private groupEventsByTable(events: ContentEvent[]): ContentEventsByTable {
		return events.reduce<ContentEventsByTable>(
			(groups, event) => ({ ...groups, [event.tableName]: [...(groups[event.tableName] || []), event] }),
			{}
		)
	}

	private async verifyReadPermissionsForTable(
		schema: Model.Schema,
		entity: Model.Entity,
		db: KnexWrapper,
		events: ContentEvent[],
		predicateFactory: PredicateFactory
	): Promise<PermissionsByRow> {
		const rowAffectedColumns = this.getAffectedColumnsByRow(events)

		const ids = events.map(it => it.rowId)
		let qb = this.createBaseSelectBuilder(db, entity, ids)

		qb = this.buildPredicates(qb, Acl.Operation.read, rowAffectedColumns, entity, predicateFactory, schema)

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
		db: KnexWrapper,
		events: ContentEvent[],
		predicateFactory: PredicateFactory
	): Promise<PermissionsByRow> {
		const ids = events.map(it => it.rowId)

		const affectedColumnsByType: { [type: string]: AffectedColumnsByRow } = {}
		let qb = this.createBaseSelectBuilder(db, entity, ids)

		const eventToOperationMapping = {
			[EventType.create]: Acl.Operation.create,
			[EventType.update]: Acl.Operation.update,
			[EventType.delete]: Acl.Operation.delete,
		}
		for (const eventType of ContentEvents) {
			const typeEvents = events.filter(it => it.type === eventType)
			affectedColumnsByType[eventType] = this.getAffectedColumnsByRow(typeEvents)
			qb = this.buildPredicates(
				qb,
				eventToOperationMapping[eventType],
				affectedColumnsByType[eventType],
				entity,
				predicateFactory,
				schema
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

	private buildPredicates(
		qb: SelectBuilder,
		operation: Acl.Operation,
		rowAffectedColumns: AffectedColumnsByRow,
		entity: Model.Entity,
		predicateFactory: PredicateFactory,
		schema: Model.Schema
	): SelectBuilder {
		const columnToField = Object.values(entity.fields).reduce<{ [column: string]: string }>(
			(result, field) => ({
				...result,
				[getColumnName(schema, entity, field.name)]: field.name,
			}),
			{}
		)

		const whereBuilder = new WhereBuilder(schema, new JoinBuilder(schema), new ConditionBuilder())

		const columns = Object.values(rowAffectedColumns).reduce(
			(result, fields) => [...result, ...fields.filter(it => result.indexOf(it) < 0)],
			[]
		)

		for (const column of columns) {
			const fieldPredicate =
				operation === Acl.Operation.delete
					? predicateFactory.create(entity, operation)
					: predicateFactory.create(entity, operation, [columnToField[column]])

			qb = whereBuilder.buildAdvanced(entity, new Path([]), fieldPredicate, cb =>
				qb.select(
					expr =>
						expr.selectCondition(condition => {
							cb(condition)
							if (condition.isEmpty()) {
								condition.raw('true')
							}
						}),
					this.formatPermissionColumn(column, operation)
				)
			)
		}

		return qb
	}

	private createBaseSelectBuilder(db: KnexWrapper, entity: Model.Entity, ids: string[]): SelectBuilder {
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
		operation: Acl.Operation
	) {
		return affectedColumnsByRow[row.__primary].reduce(
			(acc, column) => acc && row[this.formatPermissionColumn(column, operation)],
			true
		)
	}

	private formatPermissionColumn(columnName: string, operation: Acl.Operation) {
		return `${columnName}_${operation}`
	}

	private isContentEvent(it: Event): it is ContentEvent {
		return ContentEvents.includes(it.type as ContentEvent['type'])
	}
}

namespace PermissionsVerifier {
	export type Result = { [eventId: string]: EventPermission }

	export type Context = {
		variables: Acl.VariablesMap
		identity: Identity
		acl: Acl.Schema
	}

	export enum EventPermission {
		forbidden = 'forbidden',
		canView = 'canView',
		canApply = 'canApply',
	}
}

export default PermissionsVerifier
