import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import type { StockImageFileKindProps } from '../../fileKinds'
import { getStockImageFileKind } from '../../fileKinds'
import { PublicSingleKindFileRepeaterProps, SingleKindFileRepeater } from '../../internalComponents'

export type ImageFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindFileRepeaterProps<AcceptArtifacts, SFExtraProps>
	& StockImageFileKindProps<AcceptArtifacts>

export const ImageFileRepeater = Component<ImageFileRepeaterProps>(
	props => (
		<SingleKindFileRepeater {...props} kindFactory={getStockImageFileKind} />
	),
	'ImageFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: ImageFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
