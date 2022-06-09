import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockAudioFileKindProps } from '../stockFileKinds'
import { getStockAudioFileKind } from '../stockFileKinds'

export type AudioFileRepeaterProps<AcceptArtifacts = unknown> =
	& SugaredRelativeEntityList
	& StockAudioFileKindProps<AcceptArtifacts>
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
				fileKind: getStockAudioFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'AudioFileRepeater',
) as <AcceptArtifacts = unknown>(props: AudioFileRepeaterProps<AcceptArtifacts>) => ReactElement | null
