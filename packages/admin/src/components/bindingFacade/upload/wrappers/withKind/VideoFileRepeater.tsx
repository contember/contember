import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { getStockVideoFileKind } from '../../fileKinds'
import { PublicSingleKindFileRepeaterProps, SingleKindFileRepeater } from '../../internalComponents'
import { VideoFileDataExtractorProps } from '../../fileDataExtractors'

export type VideoFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindFileRepeaterProps<AcceptArtifacts, SFExtraProps>
	& VideoFileDataExtractorProps

/**
 * @example
 * ```
 * <VideoFileRepeater
 *   field="videos"
 *   urlField="video.url"
 *   label="Video serie"
 *   sortableBy="order"
 * />
 * ```
 *
 * @group Uploads
 */
export const VideoFileRepeater = Component<VideoFileRepeaterProps>(
	props => (
		<SingleKindFileRepeater {...props} kindFactory={getStockVideoFileKind} />
	),
	'VideoFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: VideoFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
