import { SubTreeIdentifier } from '../treeParameters'
import { RootAccessor } from './RootAccessor'

export type GetSubTreeRoot = (identifier: SubTreeIdentifier) => RootAccessor | undefined
