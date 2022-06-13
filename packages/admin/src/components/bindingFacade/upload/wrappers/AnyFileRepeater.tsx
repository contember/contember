import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockAnyFileKindProps } from '../stockFileKinds'
import { getStockAnyFileKind } from '../stockFileKinds'

export type AnyFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& SugaredRelativeEntityList
	& StockAnyFileKindProps<AcceptArtifacts, SFExtraProps>
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
				hasFileSelection: 'selectFormComponent' in props,
				fileKind: getStockAnyFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'AnyFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: AnyFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
