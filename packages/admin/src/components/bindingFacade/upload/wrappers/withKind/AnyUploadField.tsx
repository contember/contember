import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import type { StockAnyFileKindProps } from '../../fileKinds'
import { getStockAnyFileKind } from '../../fileKinds'
import { PublicSingleKindUploadFieldProps, SingleKindUploadField } from '../../internalComponents'

export type AnyUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindUploadFieldProps<AcceptArtifacts, SFExtraProps>
	& StockAnyFileKindProps<AcceptArtifacts>

export const AnyUploadField = Component<AnyUploadFieldProps>(
	props => (
		<SingleKindUploadField {...props} kindFactory={getStockAnyFileKind}/>
	),
	'AnyUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: AnyUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
