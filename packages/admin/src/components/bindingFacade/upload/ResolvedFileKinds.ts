import type { EntityAccessor, SugaredFieldProps } from '@contember/binding'
import type { NormalizedDiscriminatedData } from '../discrimination'
import type { FullFileKind } from './interfaces'

export type ResolvedFileKinds =
	| {
			isDiscriminated: true
			discriminationField: SugaredFieldProps['field']
			baseEntity: string | undefined
			fileKinds: NormalizedDiscriminatedData<FullFileKind<any, any>>
	  }
	| {
			isDiscriminated: false
			fileKind: FullFileKind<any, any>
			hasUploadedFile: (entity: EntityAccessor) => boolean
	  }
