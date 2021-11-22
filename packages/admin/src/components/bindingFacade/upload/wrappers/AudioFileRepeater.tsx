import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockAudioFileKindProps } from '../stockFileKinds'
import { getStockAudioFileKind } from '../stockFileKinds'

export interface AudioFileRepeaterProps<AcceptArtifacts = unknown>
	extends SugaredRelativeEntityList,
		StockAudioFileKindProps<AcceptArtifacts>,
		Omit<FileInputPublicProps, 'label'> {
	sortableBy?: SugaredFieldProps['field']
	label?: ReactNode
	itemLabel: string
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
