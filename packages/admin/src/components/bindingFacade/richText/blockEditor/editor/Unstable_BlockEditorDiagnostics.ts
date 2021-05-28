import type { BatchUpdatesOptions, EntityAccessor, SugaredUnconstrainedQualifiedEntityList } from '@contember/binding'
import type { ReactNode } from 'react'

export interface Unstable_BlockEditorDiagnostics {
	entities: SugaredUnconstrainedQualifiedEntityList['entities']
	persistedAtField: string
	operationsField: string
	identify: (
		getParentAccessor: EntityAccessor.GetEntityAccessor,
		getNewLogEntity: EntityAccessor.GetEntityAccessor,
		options: BatchUpdatesOptions,
	) => void
	identificationStaticRender: ReactNode
}
