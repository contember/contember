import { Component, EntityAccessor } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareUploadField, FileInputPublicProps } from '../internalComponents'
import type { StockImageFileKindProps } from '../stockFileKinds'
import { getStockImageFileKind } from '../stockFileKinds'

export type ImageUploadFieldProps<AcceptArtifacts = unknown> =
	& StockImageFileKindProps<AcceptArtifacts>
	& FileInputPublicProps

export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<BareUploadField
			{...props}
			fileKinds={{
				isDiscriminated: false,
				fileKind: getStockImageFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'ImageUploadField',
) as <AcceptArtifacts = unknown>(props: ImageUploadFieldProps<AcceptArtifacts>) => ReactElement | null
