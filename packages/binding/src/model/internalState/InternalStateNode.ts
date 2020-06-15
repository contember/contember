import { InternalEntityListState } from './InternalEntityListState'
import { InternalEntityState } from './InternalEntityState'
import { InternalFieldState } from './InternalFieldState'

export type InternalRootStateNode = InternalEntityState | InternalEntityListState
export type InternalStateNode = InternalEntityState | InternalEntityListState | InternalFieldState
