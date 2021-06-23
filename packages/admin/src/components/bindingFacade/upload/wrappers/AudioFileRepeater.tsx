import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockAudioFileKindProps } from '../stockFileKinds'
import { getStockAudioFileKind } from '../stockFileKinds'

export interface AudioFileRepeaterProps<AcceptArtifacts = unknown>
	extends SugaredRelativeEntityList,
		StockAudioFileKindProps<AcceptArtifacts>,
		FileInputPublicProps {
	sortableBy?: SugaredFieldProps['field']
}

export const AudioFileRepeater = Component<AudioFileRepeaterProps>(
	props => (
		<BareFileRepeater
			{...props}
			fileKinds={{
				isDiscriminated: false,
				fileKind: getStockAudioFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'AudioFileRepeater',
) as <AcceptArtifacts = unknown>(props: AudioFileRepeaterProps<AcceptArtifacts>) => ReactElement | null
