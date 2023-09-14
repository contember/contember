import { Component } from '@contember/react-binding'
import type { ReactElement } from 'react'
import { getStockVideoFileKind } from '../../fileKinds'
import { PublicSingleKindUploadFieldProps, SingleKindUploadField } from '../../internalComponents'
import { VideoFileDataExtractorProps } from '../../fileDataExtractors'

export type VideoUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindUploadFieldProps<AcceptArtifacts, SFExtraProps>
	& VideoFileDataExtractorProps

/**
 * @example
 * ```
 * <VideoUploadField urlField="video.url" label="Video upload" />
 * ```
 *
 * @group Uploads
 */
export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<SingleKindUploadField {...props} kindFactory={getStockVideoFileKind} />
	),
	'VideoUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: VideoUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
