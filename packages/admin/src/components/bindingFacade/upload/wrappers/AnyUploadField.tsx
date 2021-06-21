import { Component, EntityAccessor } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareUploadField, FileInputPublicProps } from '../internalComponents'
import type { StockAnyFileKindProps } from '../stockFileKinds'
import { getStockAnyFileKind } from '../stockFileKinds'

export interface AnyUploadFieldProps<AcceptArtifacts = unknown>
	extends StockAnyFileKindProps<AcceptArtifacts>,
		FileInputPublicProps {}

export const AnyUploadField = Component<AnyUploadFieldProps>(
	props => (
		<BareUploadField
			{...props}
			fileKinds={{
				isDiscriminated: false,
				fileKind: getStockAnyFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'AnyUploadField',
) as <AcceptArtifacts = unknown>(props: AnyUploadFieldProps<AcceptArtifacts>) => ReactElement | null
