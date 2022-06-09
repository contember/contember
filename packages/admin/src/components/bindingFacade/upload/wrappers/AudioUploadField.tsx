import { Component, EntityAccessor } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareUploadField, FileInputPublicProps } from '../internalComponents'
import type { StockAudioFileKindProps } from '../stockFileKinds'
import { getStockAudioFileKind } from '../stockFileKinds'

export type AudioUploadFieldProps<AcceptArtifacts = unknown> =
	& StockAudioFileKindProps<AcceptArtifacts>
	& FileInputPublicProps

export const AudioUploadField = Component<AudioUploadFieldProps>(
	props => (
		<BareUploadField
			{...props}
			fileKinds={{
				isDiscriminated: false,
				fileKind: getStockAudioFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'AudioUploadField',
) as <AcceptArtifacts = unknown>(props: AudioUploadFieldProps<AcceptArtifacts>) => ReactElement | null
