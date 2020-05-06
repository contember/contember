import * as React from 'react'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'

// TODO this API is stupid. It's too similar to `useAccessorTreeState` even though it's subtly different.
export const AccessorTreeStateContext = React.createContext<AccessorTreeState>({
	name: AccessorTreeStateName.Uninitialized,
	getEntityByKey: () => undefined,
})
AccessorTreeStateContext.displayName = 'AccessorTreeStateContext'
