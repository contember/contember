import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import type { StockVideoFileKindProps } from '../../fileKinds'
import { getStockVideoFileKind } from '../../fileKinds'
import { PublicSingleKindUploadFieldProps, SingleKindUploadField } from '../../internalComponents'

export type VideoUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindUploadFieldProps<AcceptArtifacts, SFExtraProps>
	& StockVideoFileKindProps<AcceptArtifacts>

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<SingleKindUploadField {...props} kindFactory={getStockVideoFileKind} />
	),
	'VideoUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: VideoUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
