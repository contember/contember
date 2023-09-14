import type { EntityAccessor, Environment } from '@contember/react-binding'
import type { ReactNode } from 'react'
import type { NormalizedDiscriminatedData, SugaredDiscriminateBy } from '../../../../discrimination'

export interface PopulateEmbedDataOptions<EmbedArtifacts = any> {
	source: string
	embedArtifacts: EmbedArtifacts
	entity: EntityAccessor
}

export interface EmbedHandler<EmbedArtifacts = any> {
	debugName: string // Optional for error messages

	staticRender: (environment: Environment) => ReactNode
	handleSource: (source: string, url: URL | undefined) => undefined | EmbedArtifacts | Promise<EmbedArtifacts | undefined>
	renderEmbed: () => ReactNode
	populateEmbedData: (options: PopulateEmbedDataOptions<EmbedArtifacts>) => void
	discriminateBy: SugaredDiscriminateBy
}

export type NormalizedEmbedHandlers = NormalizedDiscriminatedData<EmbedHandler>
