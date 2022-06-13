import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import type { DiscriminatedFileKind } from '../interfaces'
import { getStockAnyFileKind, StockAnyFileKindProps } from './getStockAnyFileKind'

export type AnyFilesProps<AcceptArtifacts = unknown> =
	& StockAnyFileKindProps<AcceptArtifacts>
	& {
		discriminateBy: DiscriminatedFileKind['discriminateBy']
	}

export const AnyFiles = Component<AnyFilesProps>(
	({ discriminateBy, ...props }) => <FileKind {...getStockAnyFileKind(props)} discriminateBy={discriminateBy} />,
	'AnyFiles',
) as <AcceptArtifacts = unknown>(props: AnyFilesProps<AcceptArtifacts>) => ReactElement | null
