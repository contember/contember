import * as React from 'react'
import { SuccessfulPersistResult } from './PersistResult'

export interface AccessorTreeStateOptions {
	nodeTree: React.ReactNode
	autoInitialize?: boolean

	unstable_onSuccessfulPersist?: (result: SuccessfulPersistResult) => void // TODO this is temporary
}
