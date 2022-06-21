import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import type { StockAnyFileKindProps } from '../../fileKinds'
import { getStockAnyFileKind } from '../../fileKinds'
import { PublicSingleKindFileRepeaterProps, SingleKindFileRepeater } from '../../internalComponents'

export type AnyFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindFileRepeaterProps<AcceptArtifacts, SFExtraProps>
	& StockAnyFileKindProps<AcceptArtifacts>

export const AnyFileRepeater = Component<AnyFileRepeaterProps>(
	props => (
		<SingleKindFileRepeater {...props} kindFactory={getStockAnyFileKind} />
	),
	'AnyFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: AnyFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
