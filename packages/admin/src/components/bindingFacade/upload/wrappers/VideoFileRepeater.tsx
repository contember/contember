import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockVideoFileKindProps } from '../stockFileKinds'
import { getStockVideoFileKind } from '../stockFileKinds'

export interface VideoFileRepeaterProps<AcceptArtifacts = unknown>
	extends SugaredRelativeEntityList,
		StockVideoFileKindProps<AcceptArtifacts>,
		FileInputPublicProps {
	sortableBy?: SugaredFieldProps['field']
}

export const VideoFileRepeater = Component<VideoFileRepeaterProps>(
	props => (
		<BareFileRepeater
			{...props}
			fileKinds={{
				isDiscriminated: false,
				fileKind: getStockVideoFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'VideoFileRepeater',
) as <AcceptArtifacts = unknown>(props: VideoFileRepeaterProps<AcceptArtifacts>) => ReactElement | null
