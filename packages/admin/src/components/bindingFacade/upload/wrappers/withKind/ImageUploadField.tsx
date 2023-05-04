import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { getStockImageFileKind } from '../../fileKinds'
import { PublicSingleKindUploadFieldProps, SingleKindUploadField } from '../../internalComponents'
import { ImageFileDataExtractorProps } from '../../fileDataExtractors'

export type ImageUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindUploadFieldProps<AcceptArtifacts, SFExtraProps>
	& ImageFileDataExtractorProps

/**
 * @example
 * ```
 * <ImageUploadField urlField="image.url" label="Image upload" />
 * ```
 *
 * @group Uploads
 */
export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<SingleKindUploadField {...props} kindFactory={getStockImageFileKind} />
	),
	'ImageUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: ImageUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
