import { Component } from '@contember/react-binding'
import type { ReactElement } from 'react'
import { getStockAudioFileKind } from '../../fileKinds'
import { PublicSingleKindUploadFieldProps, SingleKindUploadField } from '../../internalComponents'
import { AudioFileDataExtractorProps } from '../../fileDataExtractors'

export type AudioUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindUploadFieldProps<AcceptArtifacts, SFExtraProps>
	& AudioFileDataExtractorProps

/**
 * @example
 * ```
 * <AudioUploadField urlField="file.url" label="Audio upload" />
 * ```
 *
 * @group Uploads
 */
export const AudioUploadField = Component<AudioUploadFieldProps>(
	props => (
		<SingleKindUploadField {...props} kindFactory={getStockAudioFileKind} />
	),
	'AudioUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: AudioUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
