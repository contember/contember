import { EntityAccessor, Environment } from '@contember/react-binding'
import { ReactElement } from 'react'
import { AccessorErrorsHolder } from '../../errors'
import { AcceptFileOptions, FullFileKind } from '../fileKinds'

export interface AcceptedFile<AcceptArtifacts = any> {
	fileKind: FullFileKind<any, AcceptArtifacts>
	finalizeEntity?: (entity: EntityAccessor) => void
}

export type ResolvedFileEntity =
	& {
		parentEntity: EntityAccessor
		destroy?: () => void
		getErrorHolders: () => AccessorErrorsHolder[]
	}
	& (
		| {
			fileEntity: EntityAccessor
			fileKind: FullFileKind<any, any>
			isEmpty: false
		}
		| {
			fileEntity: EntityAccessor | undefined
			fileKind: FullFileKind<any, any> | undefined
			isEmpty: true
		}
	)

export interface FileHandler {
	acceptedMimes: string | string[] | null

	hasBaseEntity: boolean

	acceptFile(fileOptions: AcceptFileOptions): Promise<AcceptedFile | undefined>

	resolveEntity(accessor: EntityAccessor): ResolvedFileEntity

	staticRender(environment: Environment): ReactElement
}
