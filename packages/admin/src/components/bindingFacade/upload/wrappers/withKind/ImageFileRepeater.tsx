import { Component } from '@contember/react-binding'
import type { ReactElement } from 'react'
import { getStockImageFileKind } from '../../fileKinds'
import { PublicSingleKindFileRepeaterProps, SingleKindFileRepeater } from '../../internalComponents'
import { ImageFileDataExtractorProps } from '../../fileDataExtractors'

export type ImageFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindFileRepeaterProps<AcceptArtifacts, SFExtraProps>
	& ImageFileDataExtractorProps

/**
 * @example
 * ```
 * <ImageFileRepeater
 *   field="images"
 *   urlField="image.url"
 *   label="Gallery"
 *   sortableBy="order"
 * />
 * ```
 *
 * @group Uploads
 */
export const ImageFileRepeater = Component<ImageFileRepeaterProps>(
	props => (
		<SingleKindFileRepeater {...props} kindFactory={getStockImageFileKind} />
	),
	'ImageFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: ImageFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
