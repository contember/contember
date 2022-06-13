import { Component, EntityAccessor } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareUploadField, FileInputPublicProps } from '../internalComponents'
import type { StockVideoFileKindProps } from '../stockFileKinds'
import { getStockVideoFileKind } from '../stockFileKinds'

export type VideoUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& StockVideoFileKindProps<AcceptArtifacts, SFExtraProps>
	& FileInputPublicProps

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<BareUploadField
			{...props}
			fileKinds={{
				isDiscriminated: false,
				hasFileSelection: 'selectFormComponent' in props,
				fileKind: getStockVideoFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'VideoUploadField',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: VideoUploadFieldProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
