import { Mapper, PathFactory, WhereBuilder } from '@contember/engine-content-api'
import { IndirectListener, JunctionListener } from './TriggerListenersStore'
import { Input } from '@contember/schema'
export declare class TriggerIndirectChangesFetcher {
	private readonly mapper
	private readonly whereBuilder
	private readonly pathFactory
	constructor(mapper: Mapper, whereBuilder: WhereBuilder, pathFactory: PathFactory)
	fetch(listener: IndirectListener | JunctionListener, where: Input.Where): Promise<Input.PrimaryValue[]>
}
//# sourceMappingURL=TriggerIndirectChangesFetcher.d.ts.map
