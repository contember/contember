import { EntityAccessor, Environment } from '@contember/binding'
import * as React from 'react'
import {
	NormalizedDiscriminatedData,
	SugaredDiscriminateBy,
	SugaredDiscriminateByScalar,
} from '../../../discrimination'

export interface PopulateEmbedDataOptions<EmbedArtifacts = any> {
	source: string
	embedArtifacts: EmbedArtifacts
	batchUpdates: EntityAccessor['batchUpdates']
	environment: Environment
}

export interface RenderEmbedProps {
	entity: EntityAccessor
}

export interface EmbedHandler<EmbedArtifacts = any> {
	debugName: string // Optional for error messages

	getStaticFields: (environment: Environment) => React.ReactNode
	canHandleSource: (source: string, url: URL | undefined) => boolean | EmbedArtifacts
	renderEmbed: (props: RenderEmbedProps) => React.ReactNode
	populateEmbedData: (options: PopulateEmbedDataOptions<EmbedArtifacts>) => void

	// Exactly one of these *MUST* be defined
	discriminateBy?: SugaredDiscriminateBy
	discriminateByScalar?: SugaredDiscriminateByScalar
}

export type NormalizedEmbedHandlers = NormalizedDiscriminatedData<EmbedHandler, EmbedHandler>
