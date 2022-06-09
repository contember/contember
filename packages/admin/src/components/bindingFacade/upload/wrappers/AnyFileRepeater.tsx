import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockAnyFileKindProps } from '../stockFileKinds'
import { getStockAnyFileKind } from '../stockFileKinds'

export type AnyFileRepeaterProps<AcceptArtifacts = unknown> =
	& SugaredRelativeEntityList
	& StockAnyFileKindProps<AcceptArtifacts>
	& FileInputPublicProps
	& {
		sortableBy?: SugaredFieldProps['field']
		boxLabel?: ReactNode
		label: ReactNode
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
