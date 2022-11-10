import { Mapper, PathFactory, WhereBuilder } from '@contember/engine-content-api'
import { IndirectListener, JunctionListener } from './TriggerListenersStore'
import { SelectBuilder } from '@contember/database'
import { Input } from '@contember/schema'

export class TriggerIndirectChangesFetcher {
	constructor(
		private readonly mapper: Mapper,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
	) {
	}

	public async fetch(
		listener: IndirectListener | JunctionListener,
		where: Input.Where,
	): Promise<Input.PrimaryValue[]> {
		for (const key of listener.path.reverse()) {
			where = { [key]: where }
		}
		const qb = SelectBuilder.create<{ id: Input.PrimaryValue }>()
			.from(listener.rootEntity.tableName, 'root_')
			.select(['root_', listener.rootEntity.primaryColumn], 'id')
		const path = this.pathFactory.create([])
		const qbWithWhere = this.whereBuilder.build(qb, listener.rootEntity, path, where)

		return (await qbWithWhere.getResult(this.mapper.db)).map(it => it.id)
	}

}
