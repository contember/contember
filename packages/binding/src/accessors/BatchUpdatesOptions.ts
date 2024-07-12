import type { GetEntityByKey } from './GetEntityByKey'
import type { GetEntityListSubTree } from './GetEntityListSubTree'
import type { GetEntitySubTree } from './GetEntitySubTree'

export interface BatchUpdatesOptions {
	getEntityByKey: GetEntityByKey
	getEntityListSubTree: GetEntityListSubTree
	getEntitySubTree: GetEntitySubTree
}
