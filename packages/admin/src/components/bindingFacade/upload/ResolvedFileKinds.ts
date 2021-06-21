import type { EntityAccessor, SugaredFieldProps } from '@contember/binding'
import type { NormalizedDiscriminatedData } from '../discrimination'
import type { FullFileKind } from './interfaces'

export type ResolvedFileKinds =
	| {
			isDiscriminated: true
			discriminationField: SugaredFieldProps['field']
			fileKinds: NormalizedDiscriminatedData<FullFileKind>
	  }
	| {
			isDiscriminated: false
			fileKind: FullFileKind
			hasUploadedFile: (entity: EntityAccessor) => boolean
	  }
