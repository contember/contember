import { ReactNode } from 'react'
import { FullFileKind } from './FullFileKind'
import { EntityAccessor, SugaredFieldProps } from '@contember/binding'
import { SelectFileInputSelectionComponentProps } from '../internalComponents/selection/SelectFileInput'

export type DiscriminatedFileKindsProps<SFExtraProps extends {} = {}> =
	& SelectFileInputSelectionComponentProps<any>
	& {
		discriminationField: SugaredFieldProps['field']
		children: ReactNode
		baseEntity?: string
	}

export type SingleKindFileProps =
	& FullFileKind
	& SelectFileInputSelectionComponentProps<any>
	& {
		hasUploadedFile: (entity: EntityAccessor) => boolean
	}

export type HybridFileKindProps =
	| DiscriminatedFileKindsProps
	| SingleKindFileProps
