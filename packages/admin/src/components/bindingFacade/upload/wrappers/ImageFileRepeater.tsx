import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockImageFileKindProps } from '../stockFileKinds'
import { getStockImageFileKind } from '../stockFileKinds'

export type ImageFileRepeaterProps<AcceptArtifacts = unknown> =
	& SugaredRelativeEntityList
	& StockImageFileKindProps<AcceptArtifacts>
	& FileInputPublicProps
	& {
		sortableBy?: SugaredFieldProps['field']
		boxLabel?: ReactNode
		label: ReactNode
	}

export const ImageFileRepeater = Component<ImageFileRepeaterProps>(
	props => (
		<BareFileRepeater
			{...props}
			fileKinds={{
				isDiscriminated: false,
				fileKind: getStockImageFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'ImageFileRepeater',
) as <AcceptArtifacts = unknown>(props: ImageFileRepeaterProps<AcceptArtifacts>) => ReactElement | null
