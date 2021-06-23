import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockAnyFileKindProps } from '../stockFileKinds'
import { getStockAnyFileKind } from '../stockFileKinds'

export interface AnyFileRepeaterProps<AcceptArtifacts = unknown>
	extends SugaredRelativeEntityList,
		StockAnyFileKindProps<AcceptArtifacts>,
		FileInputPublicProps {
	sortableBy?: SugaredFieldProps['field']
}

export const AnyFileRepeater = Component<AnyFileRepeaterProps>(
	props => (
		<BareFileRepeater
			{...props}
			fileKinds={{
				isDiscriminated: false,
				fileKind: getStockAnyFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'AnyFileRepeater',
) as <AcceptArtifacts = unknown>(props: AnyFileRepeaterProps<AcceptArtifacts>) => ReactElement | null
