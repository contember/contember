import { BindingError } from '@contember/react-binding'
import type { ReactElement } from 'react'
import { SugaredDiscriminateBy } from '../../discrimination'
import { SelectFileInputSelectionComponentProps } from '../internalComponents/selection/SelectFileInput'
import { FullFileKind } from './FullFileKind'

export type FileKindProps<UploadResult = unknown, AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& FullFileKind<UploadResult, AcceptArtifacts>
	& {
		discriminateBy: SugaredDiscriminateBy
		fileSelection: SelectFileInputSelectionComponentProps<SFExtraProps>
	}

export function FileKind<UploadResult = unknown, AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(
	props: FileKindProps<UploadResult, AcceptArtifacts, SFExtraProps>,
): ReactElement | null {
	throw new BindingError(`Cannot render FileKind outside a supporting upload component!`)
}
