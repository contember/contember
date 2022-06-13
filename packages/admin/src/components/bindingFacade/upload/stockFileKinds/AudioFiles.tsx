import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import type { DiscriminatedFileKind } from '../interfaces'
import type { StockAudioFileKindProps } from './getStockAudioFileKind'
import { getStockAudioFileKind } from './getStockAudioFileKind'

export type AudioFilesProps<AcceptArtifacts = unknown>
	= StockAudioFileKindProps<AcceptArtifacts>
	& {
		discriminateBy: DiscriminatedFileKind['discriminateBy']
	}

export const AudioFiles = Component<AudioFilesProps>(
	({ discriminateBy, ...props }) => <FileKind {...getStockAudioFileKind(props)} discriminateBy={discriminateBy} />,
	'AudioFiles',
) as <AcceptArtifacts = unknown>(props: AudioFilesProps<AcceptArtifacts>) => ReactElement | null
