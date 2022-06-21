import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import type { StockVideoFileKindProps } from '../../fileKinds'
import { getStockVideoFileKind } from '../../fileKinds'
import { PublicSingleKindFileRepeaterProps, SingleKindFileRepeater } from '../../internalComponents'

export type VideoFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindFileRepeaterProps<AcceptArtifacts, SFExtraProps>
	& StockVideoFileKindProps<AcceptArtifacts>

export const VideoFileRepeater = Component<VideoFileRepeaterProps>(
	props => (
		<SingleKindFileRepeater {...props} kindFactory={getStockVideoFileKind} />
	),
	'VideoFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: VideoFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
