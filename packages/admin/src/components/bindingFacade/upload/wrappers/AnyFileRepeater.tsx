import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockAnyFileKindProps } from '../stockFileKinds'
import { getStockAnyFileKind } from '../stockFileKinds'

export interface AnyFileRepeaterProps<AcceptArtifacts = unknown>
	extends SugaredRelativeEntityList,
		StockAnyFileKindProps<AcceptArtifacts>,
		Omit<FileInputPublicProps, 'label'> {
	sortableBy?: SugaredFieldProps['field']
	label?: ReactNode
	itemLabel: ReactNode
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
