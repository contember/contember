import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import type { StockAudioFileKindProps } from '../factories/getStockAudioFileKind'
import { getStockAudioFileKind } from '../factories/getStockAudioFileKind'
import { SelectFileInputSelectionComponentProps } from '../../internalComponents/selection/SelectFileInput'
import { SugaredDiscriminateBy } from '../../../discrimination'

export type AudioFilesProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =

	& StockAudioFileKindProps<AcceptArtifacts>
	& SelectFileInputSelectionComponentProps<SFExtraProps>
	& {
		discriminateBy: SugaredDiscriminateBy
	}

export const AudioFiles = Component<AudioFilesProps>(
	({
		 discriminateBy,
		 fileSelectionComponent,
		 fileSelectionLabel,
		 fileSelectionProps,
		 ...props
	 }) => (
		<FileKind
			{...getStockAudioFileKind(props)}
			fileSelection={{ fileSelectionComponent, fileSelectionLabel, fileSelectionProps }}
			discriminateBy={discriminateBy}
		/>
	),
	'AudioFiles',
) as <AcceptArtifacts = unknown>(props: AudioFilesProps<AcceptArtifacts>) => ReactElement | null
