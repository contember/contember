import * as React from 'react'
import { SuccessfulPersistResult } from './PersistResult'

export const TriggerPersistContext = React.createContext<undefined | (() => Promise<SuccessfulPersistResult>)>(
	undefined,
)
TriggerPersistContext.displayName = 'TriggerPersistContext'
