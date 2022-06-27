import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import type { StockImageFileKindProps } from '../../fileKinds'
import { getStockImageFileKind } from '../../fileKinds'
import { PublicSingleKindUploadFieldProps, SingleKindUploadField } from '../../internalComponents'

export type ImageUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindUploadFieldProps<AcceptArtifacts, SFExtraProps>
	& StockImageFileKindProps<AcceptArtifacts>

export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<SingleKindUploadField {...props} kindFactory={getStockImageFileKind} />
	),
	'ImageUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: ImageUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
