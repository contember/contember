import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import type { StockAudioFileKindProps } from '../../fileKinds'
import { getStockAudioFileKind } from '../../fileKinds'
import { PublicSingleKindFileRepeaterProps, SingleKindFileRepeater } from '../../internalComponents'

export type AudioFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindFileRepeaterProps<AcceptArtifacts, SFExtraProps>
	& StockAudioFileKindProps<AcceptArtifacts>

export const AudioFileRepeater = Component<AudioFileRepeaterProps>(
	props => (
		<SingleKindFileRepeater {...props} kindFactory={getStockAudioFileKind} />
	),
	'AudioFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: AudioFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
