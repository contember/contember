import type { GetEntityByKey } from './GetEntityByKey.js'
import type { GetEntityListSubTree } from './GetEntityListSubTree.js'
import type { GetEntitySubTree } from './GetEntitySubTree.js'

export interface BatchUpdatesOptions {
	getEntityByKey: GetEntityByKey
	getEntityListSubTree: GetEntityListSubTree
	getEntitySubTree: GetEntitySubTree
}
