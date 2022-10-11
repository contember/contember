import { PredicatesInjector } from '../acl'
import { PathFactory, SelectBuilderFactory, WhereBuilder } from './select'
import { UniqueWhereExpander } from '../inputProcessing'
import { JunctionTableManager } from './JunctionTableManager'
import { DeleteExecutor } from './delete'
import { Updater } from './update'
import { Inserter } from './insert'
import { Model } from '@contember/schema'
import { Client } from '@contember/database'
import { Mapper } from './Mapper'

export type MapperFactoryHook = (mapper: Mapper) => void

export class MapperFactory {

	public readonly hooks: MapperFactoryHook[] = []

	constructor(
		private readonly schema: Model.Schema,
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
	}

	public create(db: Client) {
		const mapper = new Mapper(
			this.schema,
			db,
			this.predicatesInjector,
			this.selectBuilderFactory,
			this.uniqueWhereExpander,
			this.whereBuilder,
			this.junctionTableManager,
			this.deleteExecutor,
			this.updater,
			this.inserter,
			this.pathFactory,
		)
		this.hooks.forEach(it => it(mapper))
		return mapper
	}
}
