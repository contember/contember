import { Component } from '@contember/react-binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import { getStockVideoFileKind, StockVideoFileKindProps } from '../factories/getStockVideoFileKind'
import { SelectFileInputSelectionComponentProps } from '../../internalComponents/selection/SelectFileInput'
import { SugaredDiscriminateBy } from '../../../discrimination'

export type VideoFilesProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& StockVideoFileKindProps<AcceptArtifacts>
	& SelectFileInputSelectionComponentProps<SFExtraProps>
	& {
		discriminateBy: SugaredDiscriminateBy
	}

/**
 * @group Uploads
 */
export const VideoFiles = Component<VideoFilesProps>(
	({
		 discriminateBy,
		 fileSelectionComponent,
		 fileSelectionLabel,
		 fileSelectionProps,
		 ...props
	 }) => (
		<FileKind
			{...getStockVideoFileKind(props)}
			fileSelection={{ fileSelectionComponent, fileSelectionLabel, fileSelectionProps }}
			discriminateBy={discriminateBy}
		/>
	),
	'VideoFiles',
) as <AcceptArtifacts = unknown>(props: VideoFilesProps<AcceptArtifacts>) => ReactElement | null
