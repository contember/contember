import { Component, EntityAccessor } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareUploadField, FileInputPublicProps } from '../internalComponents'
import type { StockImageFileKindProps } from '../stockFileKinds'
import { getStockImageFileKind } from '../stockFileKinds'

export type ImageUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& StockImageFileKindProps<AcceptArtifacts, SFExtraProps>
	& FileInputPublicProps

export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<BareUploadField
			{...props}
			fileKinds={{
				isDiscriminated: false,
				hasFileSelection: 'selectFormComponent' in props,
				fileKind: getStockImageFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'ImageUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: ImageUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
