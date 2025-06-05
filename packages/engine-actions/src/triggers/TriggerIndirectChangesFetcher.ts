import { Mapper, PathFactory, WhereBuilder } from '@contember/engine-content-api'
import { IndirectListener, JunctionListener } from './TriggerListenersStore'
import { SelectBuilder } from '@contember/database'
import { ActionsPayload, Input, Model, Schema } from '@contember/schema'
import { JoinBuilder } from '@contember/engine-content-api'
import { getTargetEntity } from '@contember/schema-utils'

export type TriggerIndirectChangesFetcherResult = {
	id: Input.PrimaryValue
	nodes?: ActionsPayload.EntityEventPathNode[]
}[]

export class TriggerIndirectChangesFetcher {
	constructor(
		private readonly model: Model.Schema,
		private readonly mapper: Mapper,
		private readonly whereBuilder: WhereBuilder,
		private readonly joinBuilder: JoinBuilder,
		private readonly pathFactory: PathFactory,
	) {
	}

	public async fetch(
		listener: IndirectListener | JunctionListener,
		where: Input.Where,
	): Promise<TriggerIndirectChangesFetcherResult> {
		if (listener.trigger.withNodes) {
			return this.fetchWithNodes(listener, where)
		}

		for (let i = listener.path.length - 1; i >= 0; i--) {
			where = { [listener.path[i]]: where }
		}
		const qb = SelectBuilder.create<{ id: Input.PrimaryValue }>()
			.from(listener.rootEntity.tableName, 'root_')
			.select(['root_', listener.rootEntity.primaryColumn], 'id')
		const path = this.pathFactory.create([])
		const qbWithWhere = this.whereBuilder.build(qb, listener.rootEntity, path, where)

		return (await qbWithWhere.getResult(this.mapper.db))
	}

	private async fetchWithNodes(
		listener: IndirectListener | JunctionListener,
		where: Input.Where,
	): Promise<TriggerIndirectChangesFetcherResult> {
		const basePath = this.pathFactory.create([])
		let path = basePath
		let entity = listener.rootEntity
		let qb = SelectBuilder.create()
			.from(entity.tableName, path.alias)
			.select([path.alias, entity.primaryColumn], path.for(entity.primary).alias)

		for (let i = 0; i < listener.path.length; i++) {
			const relationName = listener.path[i]
			path = path.for(relationName)
			const targetEntity = getTargetEntity(this.model, entity, relationName)
			if (!targetEntity) {
				throw new Error(`Target entity for relation ${entity.name}::${relationName} not found`)
			}
			qb = this.joinBuilder.join(qb, path, entity, relationName)

			entity = targetEntity
			qb = qb.select([path.alias, targetEntity.primaryColumn], path.for(targetEntity.primary).alias)
		}

		const qbWithWhere = this.whereBuilder.build(qb, entity, path, where)

		const result = await qbWithWhere.getResult(this.mapper.db)

		return result.map(row => {
			const nodes: ActionsPayload.EntityEventPathNode[] = []
			let entity = listener.rootEntity
			let path = basePath
			const id = row[path.for(entity.primary).alias]
			for (let i = 0; i < listener.path.length; i++) {
				const relationName = listener.path[i]
				const targetEntity = getTargetEntity(this.model, entity, relationName)
				if (!targetEntity) {
					throw new Error(`Target entity for relation ${entity.name}::${relationName} not found`)
				}
				path = path.for(relationName)
				nodes.push({ relation: relationName, entity: targetEntity.name, id: row[path.for(targetEntity.primary).alias] })
				entity = targetEntity
			}
			return { id, nodes }
		})
	}
}
