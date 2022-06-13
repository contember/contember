import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import type { DiscriminatedFileKind } from '../interfaces'
import type { StockImageFileKindProps } from './getStockImageFileKind'
import { getStockImageFileKind } from './getStockImageFileKind'

export type ImageFilesProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& StockImageFileKindProps<AcceptArtifacts, SFExtraProps>
	& {
		discriminateBy: DiscriminatedFileKind['discriminateBy']
	}

export const ImageFiles = Component<ImageFilesProps>(
	({ discriminateBy, ...props }) => <FileKind {...getStockImageFileKind(props)} discriminateBy={discriminateBy} />,
	'ImageFiles',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: ImageFilesProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
