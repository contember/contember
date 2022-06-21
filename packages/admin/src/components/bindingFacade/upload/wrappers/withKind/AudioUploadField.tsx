import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import type { StockAudioFileKindProps } from '../../fileKinds'
import { getStockAudioFileKind } from '../../fileKinds'
import { PublicSingleKindUploadFieldProps, SingleKindUploadField } from '../../internalComponents'

export type AudioUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindUploadFieldProps<AcceptArtifacts, SFExtraProps>
	& StockAudioFileKindProps<AcceptArtifacts>

export const AudioUploadField = Component<AudioUploadFieldProps>(
	props => (
		<SingleKindUploadField {...props} kindFactory={getStockAudioFileKind} />
	),
	'AudioUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: AudioUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
