import { GetEntityByKey } from './GetEntityByKey'
import { GetEntityListSubTree } from './GetEntityListSubTree'
import { GetEntitySubTree } from './GetEntitySubTree'

export interface BatchUpdatesOptions {
	getEntityByKey: GetEntityByKey
	getEntityListSubTree: GetEntityListSubTree
	getEntitySubTree: GetEntitySubTree
}
