import { Client, SelectBuilder } from '@contember/database'
import { assertNever } from '../../utils'
import { Acl, Model, Schema } from '@contember/schema'
import PermissionsByIdentityFactory from '../../acl/PermissionsByIdentityFactory'
import PredicateFactory from '../../acl/PredicateFactory'
import VariableInjector from '../../acl/VariableInjector'
import WhereBuilder from '../../sql/select/WhereBuilder'
import JoinBuilder from '../../sql/select/JoinBuilder'
import Path from '../../sql/select/Path'
import { getColumnName } from '@contember/schema-utils'
import ConditionBuilder from '../../sql/select/ConditionBuilder'
import assert from 'assert'

interface PermissionContext {
	roles: string[]
	variables: Acl.VariablesMap
}

type AffectedColumnsByRow = { [rowId: string]: string[] }
type PermissionsByRow = { [rowId: string]: boolean }
type PermissionsByTable = { [tableName: string]: PermissionsByRow }
type ContentEventsByTable = { [tableName: string]: TableEvent[] }

const DeleteType = 'delete' as const
const CreateType = 'create' as const
const UpdateType = 'update' as const
type EventTypes = typeof DeleteType | typeof CreateType | typeof UpdateType

type TableEvent =
	| {
			rowId: string[]
			type: typeof DeleteType
	  }
	| {
			rowId: string[]
			type: typeof CreateType | typeof UpdateType
			values: { [column: string]: any }
	  }

interface Args {
	permissionContext: PermissionContext
	db: Client
	schema: Schema
	eventsByTable: ContentEventsByTable
}

export class PermissionsVerifier {
	constructor(private readonly permissionsByIdentityFactory: PermissionsByIdentityFactory) {}

	public async verifyReadPermissions(args: Args): Promise<PermissionsByTable> {
		return this.verifyPermissions(args.permissionContext, args.db, args.schema, args.eventsByTable, 'read')
	}

	public async verifyWritePermissions(args: Args): Promise<PermissionsByTable> {
		return this.verifyPermissions(args.permissionContext, args.db, args.schema, args.eventsByTable, 'write')
	}

	private async verifyPermissions(
		permissionContext: PermissionContext,
		db: Client,
		schema: Schema,
		eventsByTable: ContentEventsByTable,
		type: 'read' | 'write',
	): Promise<PermissionsByTable> {
		const { permissions } = this.permissionsByIdentityFactory.createPermissions(schema, {
			projectRoles: permissionContext.roles,
		})

		const predicateFactory = new PredicateFactory(
			permissions,
			new VariableInjector(schema.model, permissionContext.variables),
		)
		const entitiesByTable = Object.values(schema.model.entities).reduce<{ [tableName: string]: Model.Entity }>(
			(tables, entity) => ({ ...tables, [entity.tableName]: entity }),
			{},
		)
		const result: PermissionsByTable = {}
		for (let table in eventsByTable) {
			switch (type) {
				case 'read':
					result[table] = await this.verifyReadPermissionsForTable(
						schema.model,
						entitiesByTable[table],
						db,
						eventsByTable[table],
						predicateFactory,
					)
					break
				case 'write':
					result[table] = await this.verifyWritePermissionsForTable(
						schema.model,
						entitiesByTable[table],
						db,
						eventsByTable[table],
						predicateFactory,
					)
					break
				default:
					assertNever(type)
			}
		}
		return result
	}

	private async verifyReadPermissionsForTable(
		schema: Model.Schema,
		entity: Model.Entity,
		db: Client,
		events: TableEvent[],
		predicateFactory: PredicateFactory,
	): Promise<PermissionsByRow> {
		const rowAffectedColumns = this.getAffectedColumnsByRow(events)

		const ids = events.map(it => {
			assert.equal(it.rowId.length, 1)
			return it.rowId[0]
		})
		let qb: SelectBuilder<SelectBuilder.Result, any> = this.createBaseSelectBuilder(entity, ids)

		qb = this.buildPredicates(db, qb, Acl.Operation.read, rowAffectedColumns, entity, predicateFactory, schema)

		const result = await qb.getResult(db)
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
		events: TableEvent[],
		predicateFactory: PredicateFactory,
	): Promise<PermissionsByRow> {
		const ids = events.map(it => {
			assert.equal(it.rowId.length, 1)
			return it.rowId[0]
		})

		const affectedColumnsByType: { [type: string]: AffectedColumnsByRow } = {}
		let qb: SelectBuilder<SelectBuilder.Result, 'select' | 'from' | 'where' | 'join'> = this.createBaseSelectBuilder(
			entity,
			ids,
		)

		for (const eventType of [CreateType, UpdateType, DeleteType]) {
			const typeEvents = events.filter(it => it.type === eventType)
			affectedColumnsByType[eventType] = this.getAffectedColumnsByRow(typeEvents)
			const operation = {
				[DeleteType]: Acl.Operation.delete,
				[UpdateType]: Acl.Operation.update,
				[CreateType]: Acl.Operation.create,
			}[eventType]
			qb = this.buildPredicates(db, qb, operation, affectedColumnsByType[eventType], entity, predicateFactory, schema)
		}

		const result = await qb.getResult(db)
		const permissions: PermissionsByRow = {}
		for (let row of result) {
			let result = true
			for (const eventType of [Acl.Operation.create, Acl.Operation.update, Acl.Operation.delete]) {
				result = result && this.extractRowPermissions(row, affectedColumnsByType[eventType], eventType)
			}

			permissions[row.__primary] = result
		}

		return permissions
	}

	private createBaseSelectBuilder(entity: Model.Entity, ids: string[]) {
		return SelectBuilder.create()
			.select(entity.primaryColumn, '__primary')
			.from(entity.tableName, new Path([]).getAlias())
			.where(clause => clause.in(entity.primaryColumn, ids))
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

		const whereBuilder = new WhereBuilder(schema, new JoinBuilder(schema), new ConditionBuilder())

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
							condition = cb(condition)
							if (condition.isEmpty()) {
								return condition.raw('true')
							}
							return condition
						}),
					this.formatPermissionColumn(column, operation),
				),
			)
		}

		return withPredicates
	}

	private getAffectedColumnsByRow(events: TableEvent[]): AffectedColumnsByRow {
		return events.reduce<AffectedColumnsByRow>((result, event) => {
			assert.equal(event.rowId.length, 1)

			const currentFields = result[event.rowId[0]] || []
			const eventFields = event.type === 'delete' ? ['id'] : Object.keys(event.values)

			const newFields = [...currentFields, ...eventFields.filter(it => currentFields.indexOf(it) < 0)]
			return { ...result, [event.rowId[0]]: newFields }
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
