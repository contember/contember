import { Component, EntityAccessor } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareUploadField, FileInputPublicProps } from '../internalComponents'
import type { StockVideoFileKindProps } from '../stockFileKinds'
import { getStockVideoFileKind } from '../stockFileKinds'

export type VideoUploadFieldProps<AcceptArtifacts = unknown> =
	& StockVideoFileKindProps<AcceptArtifacts>
	& FileInputPublicProps

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<BareUploadField
			{...props}
			fileKinds={{
				isDiscriminated: false,
				fileKind: getStockVideoFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'VideoUploadField',
) as <AcceptArtifacts = unknown>(props: VideoUploadFieldProps<AcceptArtifacts>) => ReactElement | null
