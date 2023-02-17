import { Input, Model } from '@contember/schema'
import { acceptFieldVisitor, getColumnName } from '@contember/schema-utils'
import {
	OrderByHelper,
	PathFactory,
	SelectBuilderFactory,
	SelectGroupedObjects,
	SelectHydrator,
	SelectIndexedResultObjects,
	SelectResultObject,
	WhereBuilder,
} from './select'
import * as database from '@contember/database'
import { Client, ConstraintHelper, SelectBuilder } from '@contember/database'
import { PredicatesInjector } from '../acl'
import { JunctionTableManager } from './JunctionTableManager'
import { DeletedEntitiesStorage, DeleteExecutor } from './delete'
import { MutationEntryNotFoundError, MutationResultList } from './Result'
import { UpdateBuilder, Updater } from './update'
import { InsertBuilder, Inserter } from './insert'
import { tryMutation } from './ErrorUtils'
import { ObjectNode, UniqueWhereExpander } from '../inputProcessing'
import { Mutex } from '../utils'
import { CheckedPrimary } from './CheckedPrimary'
import { ImplementationException } from '../exception'

export class Mapper {
	private primaryKeyCache: Record<string, Promise<string> | string> = {}
	public readonly deletedEntities = new DeletedEntitiesStorage()
	public readonly mutex = new Mutex()
	public readonly constraintHelper: ConstraintHelper

	constructor(
		private readonly schema: Model.Schema,
		public readonly db: database.Client,
		private readonly predicatesInjector: PredicatesInjector,
		private readonly selectBuilderFactory: SelectBuilderFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly whereBuilder: WhereBuilder,
		private readonly junctionTableManager: JunctionTableManager,
		private readonly deleteExecutor: DeleteExecutor,
		private readonly updater: Updater,
		private readonly inserter: Inserter,
		private readonly pathFactory: PathFactory,
	) {
		this.constraintHelper = new ConstraintHelper(db)
	}

	public async selectField(entity: Model.Entity, where: Input.UniqueWhere | CheckedPrimary, fieldName: string) {
		const columnName = getColumnName(this.schema, entity, fieldName)

		const qb = SelectBuilder.create() //
			.from(entity.tableName, 'root_')
			.select(['root_', columnName])
		const expandedWhere = this.uniqueWhereExpander.expand(entity, where)
		const builtQb = this.whereBuilder.build(qb, entity, this.pathFactory.create([]), expandedWhere)
		const result = await builtQb.getResult(this.db)

		return result[0] !== undefined ? result[0][columnName] : undefined
	}

	public async selectAssoc(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relationPath: Model.AnyRelationContext[],
		indexBy: string,
	): Promise<SelectIndexedResultObjects> {
		const hydrator = new SelectHydrator()
		const path = this.pathFactory.create([])
		const indexByAlias: string = path.for(indexBy).alias
		const qb: SelectBuilder = SelectBuilder.create()
			.select([path.alias, getColumnName(this.schema, entity, indexBy)], indexByAlias)
		const rows = await this.selectRows(hydrator, qb, entity, input, relationPath)
		return await hydrator.hydrateAll(rows, indexByAlias)
	}

	public async select(entity: Model.Entity, input: ObjectNode<Input.ListQueryInput>, relationPath: Model.AnyRelationContext[]): Promise<SelectResultObject[]> {
		const hydrator = new SelectHydrator()
		const qb: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()

		const rows = await this.selectRows(hydrator, qb, entity, input, relationPath)

		return await hydrator.hydrateAll(rows)
	}

	public async selectUnique(
		entity: Model.Entity,
		query: ObjectNode<Input.UniqueQueryInput>,
		relationPath: Model.AnyRelationContext[],
	): Promise<SelectResultObject | null> {
		const uniqueWhere = this.uniqueWhereExpander.expand(entity, query.args.by)
		const where = query.args.filter ? { and: [uniqueWhere, query.args.filter] } : uniqueWhere
		const queryExpanded = query.withArg<Input.ListQueryInput>('filter', where)

		const rows = await this.select(entity, queryExpanded, relationPath)

		return rows[0] ?? null
	}

	public async selectGrouped(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relation: Model.JoiningColumnRelation & Model.AnyRelation,
		relationPath: Model.AnyRelationContext[],
	): Promise<SelectGroupedObjects> {
		const hydrator = new SelectHydrator()
		const path = this.pathFactory.create([])
		const groupingKey = '__grouping_key'
		const qb: SelectBuilder = SelectBuilder.create()
			.select([path.alias, relation.joiningColumn.columnName], groupingKey)

		const rows = await this.selectRows(hydrator, qb, entity, input, relationPath, relation.name)

		return await hydrator.hydrateGroups(rows, groupingKey)
	}

	private async selectRows(
		hydrator: SelectHydrator,
		qb: SelectBuilder<SelectBuilder.Result>,
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relationPath: Model.AnyRelationContext[],
		groupBy?: string,
	) {
		const inputWithOrder = OrderByHelper.appendDefaultOrderBy(entity, input, entity.orderBy ?? [])
		const path = this.pathFactory.create([])
		const augmentedBuilder = qb.from(entity.tableName, path.alias).meta('path', [...input.path, input.alias])

		const selector = this.selectBuilderFactory.create(augmentedBuilder, hydrator, relationPath)
		const filterWithPredicates = this.predicatesInjector.inject(entity, inputWithOrder.args.filter || {}, relationPath[relationPath.length - 1])
		const inputWithPredicates = inputWithOrder.withArg('filter', filterWithPredicates)
		selector.select(this, entity, inputWithPredicates, path, groupBy)
		return await selector.execute(this.db)
	}

	public async count(entity: Model.Entity, filter: Input.OptionalWhere) {
		const path = this.pathFactory.create([])
		const qb = SelectBuilder.create()
			.from(entity.tableName, path.alias)
			.select(expr => expr.raw('count(*)'), 'row_count')
		const withPredicates = this.predicatesInjector.inject(entity, filter)
		const qbWithWhere = this.whereBuilder.build(qb, entity, path, withPredicates)
		const result = await qbWithWhere.getResult(this.db)
		return result[0].row_count
	}

	public async countGrouped(
		entity: Model.Entity,
		filter: Input.OptionalWhere,
		relation: Model.JoiningColumnRelation & Model.Relation,
		relationPath: Model.AnyRelationContext[],
	): Promise<Record<string, number>> {
		const path = this.pathFactory.create([])
		const qb = SelectBuilder.create()
			.from(entity.tableName, path.alias)
			.select(expr => expr.raw('count(*)'), 'row_count')
			.select([path.alias, relation.joiningColumn.columnName])
			.groupBy([path.alias, relation.joiningColumn.columnName])
		const withPredicates = this.predicatesInjector.inject(entity, filter, relationPath[relationPath.length - 1])
		const qbWithWhere = this.whereBuilder.build(qb, entity, path, withPredicates, { relationPath })
		const rows = await qbWithWhere.getResult(this.db)
		const result = new Map<string, number>()
		for (const row of rows) {
			result.set(String(row[relation.joiningColumn.columnName]), Number(row.row_count))
		}
		return Object.fromEntries(result)
	}

	public async insert(
		entity: Model.Entity,
		data: Input.CreateDataInput,
		builderCb: (builder: InsertBuilder) => void = () => {},
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		const pushId = (id: string) => {
			const where = { [entity.primary]: id }
			this.primaryKeyCache[this.hashWhere(entity.name, where)] = id
		}
		return tryMutation(this.schema, () =>
			this.inserter.insert(this, entity, data, pushId, builderCb),
		)
	}

	public async update(
		entity: Model.Entity,
		by: Input.UniqueWhere,
		data: Input.UpdateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		return tryMutation(this.schema, async () => {
			const primaryValue = await this.getPrimaryValue(entity, by)
			if (primaryValue === undefined) {
				return [new MutationEntryNotFoundError([], by)]
			}
			return await this.updater.update(this, entity, primaryValue, data, filter)
		})
	}

	public async updateInternal(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		builderCb: (builder: UpdateBuilder) => void,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		return tryMutation(this.schema, async () => {
			const primaryValue = await this.getPrimaryValue(entity, by)
			if (primaryValue === undefined) {
				return [new MutationEntryNotFoundError([], by as Input.UniqueWhere)]
			}
			return await this.updater.updateCb(this, entity, primaryValue, builderCb)
		})
	}
	public async upsert(
		entity: Model.Entity,
		by: Input.UniqueWhere,
		update: Input.UpdateDataInput,
		create: Input.CreateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		return tryMutation(this.schema, async () => {
			const primaryValue = await this.getPrimaryValue(entity, by)
			if (primaryValue === undefined) {
				const pushIdCallback = (id: string) => {
					const where = { [entity.primary]: id }
					this.primaryKeyCache[this.hashWhere(entity.name, where)] = id
				}
				return await this.inserter.insert(this, entity, create, pushIdCallback, () => {})
			}
			return await this.updater.update(this, entity, primaryValue, update, filter)
		})
	}

	public async delete(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		return tryMutation(this.schema, () => this.deleteExecutor.execute(this, entity, by, filter))
	}

	public async connectJunction(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		thisPrimary: Input.PrimaryValue,
		otherPrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		const err = () => {
			throw new ImplementationException()
		}
		return await acceptFieldVisitor(this.schema, entity, relation, {
			visitManyHasManyOwning: ({ entity, relation }) => {
				return this.junctionTableManager.connectJunction(this.db, entity, relation, thisPrimary, otherPrimary)
			},
			visitManyHasManyInverse: ({ targetEntity, targetRelation }) => {
				return this.junctionTableManager.connectJunction(this.db, targetEntity, targetRelation, otherPrimary, thisPrimary)
			},
			visitColumn: err,
			visitOneHasMany: err,
			visitOneHasOneInverse: err,
			visitOneHasOneOwning: err,
			visitManyHasOne: err,
		})
	}

	public async disconnectJunction(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		thisPrimary: Input.PrimaryValue,
		otherPrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		const err = () => {
			throw new ImplementationException()
		}
		return await acceptFieldVisitor(this.schema, entity, relation, {
			visitManyHasManyOwning: ({ entity, relation }) => {
				return this.junctionTableManager.disconnectJunction(this.db, entity, relation, thisPrimary, otherPrimary)
			},
			visitManyHasManyInverse: ({ targetEntity, targetRelation }) => {
				return this.junctionTableManager.disconnectJunction(this.db, targetEntity, targetRelation, otherPrimary, thisPrimary)
			},
			visitColumn: err,
			visitOneHasMany: err,
			visitOneHasOneInverse: err,
			visitOneHasOneOwning: err,
			visitManyHasOne: err,
		})
	}

	public async getPrimaryValue(
		entity: Model.Entity,
		where: Input.UniqueWhere | CheckedPrimary,
	): Promise<Input.PrimaryValue | undefined> {
		if (where instanceof CheckedPrimary) {
			return where.primaryValue
		}
		const hash = this.hashWhere(entity.name, where)
		if (this.primaryKeyCache[hash]) {
			return this.primaryKeyCache[hash]
		}
		const primaryPromise = this.selectField(entity, where, entity.primary)
		this.primaryKeyCache[hash] = primaryPromise
		const primaryValue = await primaryPromise
		const uniqueFields = Object.keys(where)
		if (primaryValue && (uniqueFields.length !== 1 || uniqueFields[0] !== entity.primary)) {
			this.primaryKeyCache[this.hashWhere(entity.name, { [entity.primary]: primaryValue })] = primaryValue
		}
		return primaryValue
	}

	private hashWhere(entityName: string, where: Input.UniqueWhere): string {
		return JSON.stringify([entityName, where])
	}
}

export type MapperFactory = (db: Client) => Mapper
