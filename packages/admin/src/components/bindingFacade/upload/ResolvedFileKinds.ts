import type { EntityAccessor, SugaredFieldProps } from '@contember/binding'
import type { NormalizedDiscriminatedData } from '../discrimination'
import type { FullFileKind } from './interfaces'
import { SelectFileInputFormComponentProps } from './internalComponents/SelectFileInput'

export type ResolvedDiscriminatedFileKinds =
	& (
		| SelectFileInputFormComponentProps<any>
		| {}
	)
	& {
		isDiscriminated: true
		discriminationField: SugaredFieldProps['field']
		baseEntity: string | undefined
		hasFileSelection: boolean
		fileKinds: NormalizedDiscriminatedData<FullFileKind<any, any, any>>
	}


export type ResolvedSimpleFileKinds = {
	isDiscriminated: false
	fileKind: FullFileKind<any, any>
	hasFileSelection: boolean
	hasUploadedFile: (entity: EntityAccessor) => boolean
}

export type ResolvedFileKinds =
	| ResolvedDiscriminatedFileKinds
	| ResolvedSimpleFileKinds
