import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockAudioFileKindProps } from '../stockFileKinds'
import { getStockAudioFileKind } from '../stockFileKinds'

export type AudioFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& SugaredRelativeEntityList
	& StockAudioFileKindProps<AcceptArtifacts, SFExtraProps>
	& FileInputPublicProps
	& {
		sortableBy?: SugaredFieldProps['field']
		boxLabel?: ReactNode
		label: ReactNode
	}

export const AudioFileRepeater = Component<AudioFileRepeaterProps>(
	props => (
		<BareFileRepeater
			{...props}
			fileKinds={{
				isDiscriminated: false,
				hasFileSelection: 'selectFormComponent' in props,
				fileKind: getStockAudioFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'AudioFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: AudioFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
