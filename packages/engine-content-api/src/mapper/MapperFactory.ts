import { PredicatesInjector } from '../acl'
import { PathFactory, SelectBuilderFactory, WhereBuilder } from './select'
import { UniqueWhereExpander } from '../inputProcessing'
import { JunctionTableManager } from './JunctionTableManager'
import { DeleteExecutor } from './delete'
import { Updater } from './update'
import { Inserter } from './insert'
import { Model } from '@contember/schema'
import { Client, Connection } from '@contember/database'
import { Mapper } from './Mapper'
import { Providers } from '@contember/schema-utils'

export type MapperFactoryHook = (mapper: Mapper) => void

export class MapperFactory {

	public readonly hooks: MapperFactoryHook[] = []

	constructor(
		private readonly db: Client,
		private readonly identityId: string,
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
		private readonly providers: Providers,
	) {
	}

	public create() {
		return this.createInternal(this.db)
	}

	public transaction<T>(cb: (mapper: Mapper<Connection.TransactionLike>) => Promise<T>): Promise<T> {
		return this.db.transaction(async trx => {
			await trx.connection.query(Connection.REPEATABLE_READ)
			const mapper = this.createInternal(trx)
			return await cb(mapper)
		})
	}

	private createInternal<T extends Connection.ConnectionLike>(db: Client<T>) {
		const mapper = new Mapper<T>(
			db,
			this.identityId,
			this.providers.uuid(),
			this.schema,
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
