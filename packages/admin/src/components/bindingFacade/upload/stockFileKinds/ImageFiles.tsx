import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import type { DiscriminatedFileKind } from '../interfaces'
import type { StockImageFileKindProps } from './getStockImageFileKind'
import { getStockImageFileKind } from './getStockImageFileKind'

export interface ImageFilesProps<AcceptArtifacts = unknown> extends StockImageFileKindProps<AcceptArtifacts> {
	discriminateBy: DiscriminatedFileKind['discriminateBy']
}

export const ImageFiles = Component<ImageFilesProps>(
	({ discriminateBy, ...props }) => <FileKind {...getStockImageFileKind(props)} discriminateBy={discriminateBy} />,
	'ImageFiles',
) as <AcceptArtifacts = unknown>(props: ImageFilesProps<AcceptArtifacts>) => ReactElement | null
