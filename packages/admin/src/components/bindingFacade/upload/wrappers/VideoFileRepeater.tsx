import { Component, EntityAccessor, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import type { StockVideoFileKindProps } from '../stockFileKinds'
import { getStockVideoFileKind } from '../stockFileKinds'

export type VideoFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& SugaredRelativeEntityList
	& StockVideoFileKindProps<AcceptArtifacts, SFExtraProps>
	& FileInputPublicProps
	& {
		sortableBy?: SugaredFieldProps['field']
		boxLabel?: ReactNode
		label: ReactNode
	}

export const VideoFileRepeater = Component<VideoFileRepeaterProps>(
	props => (
		<BareFileRepeater
			{...props}
			fileKinds={{
				isDiscriminated: false,
				hasFileSelection: 'selectFormComponent' in props,
				fileKind: getStockVideoFileKind(props),
				hasUploadedFile: (entity: EntityAccessor) => entity.getField(props.urlField).value !== null,
			}}
		/>
	),
	'VideoFileRepeater',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: VideoFileRepeaterProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
