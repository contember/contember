import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import type { DiscriminatedFileKind } from '../interfaces'
import { getStockVideoFileKind, StockVideoFileKindProps } from './getStockVideoFileKind'

export type VideoFilesProps<AcceptArtifacts = unknown> =
	& StockVideoFileKindProps<AcceptArtifacts>
	& {
		discriminateBy: DiscriminatedFileKind['discriminateBy']
	}

export const VideoFiles = Component<VideoFilesProps>(
	({ discriminateBy, ...props }) => <FileKind {...getStockVideoFileKind(props)} discriminateBy={discriminateBy} />,
	'VideoFiles',
) as <AcceptArtifacts = unknown>(props: VideoFilesProps<AcceptArtifacts>) => ReactElement | null
