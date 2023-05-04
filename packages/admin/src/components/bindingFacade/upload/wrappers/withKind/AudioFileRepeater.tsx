import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { getStockAudioFileKind } from '../../fileKinds'
import { PublicSingleKindFileRepeaterProps, SingleKindFileRepeater } from '../../internalComponents'
import { AudioFileDataExtractorProps } from '../../fileDataExtractors'

export type AudioFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindFileRepeaterProps<AcceptArtifacts, SFExtraProps>
	& AudioFileDataExtractorProps

/**
 * @example
 * ```
 * <AudioFileRepeater
 *   field="songs"
 *   urlField="song.url"
 *   label="Album"
 *   sortableBy="order"
 * />
 * ```
 *
 * @group Uploads
 */
export const AudioFileRepeater = Component<AudioFileRepeaterProps>(
	props => (
		<SingleKindFileRepeater {...props} kindFactory={getStockAudioFileKind} />
	),
	'AudioFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: AudioFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
