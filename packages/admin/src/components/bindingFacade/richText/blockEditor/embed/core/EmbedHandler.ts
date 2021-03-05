import { EntityAccessor, Environment } from '@contember/binding'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import {
	NormalizedDiscriminatedData,
	SugaredDiscriminateBy,
	SugaredDiscriminateByScalar,
} from '../../../../discrimination'

export interface PopulateEmbedDataOptions<EmbedArtifacts = any> {
	source: string
	embedArtifacts: EmbedArtifacts
	entity: EntityAccessor
}

export interface EmbedHandler<EmbedArtifacts = any> {
	debugName: string // Optional for error messages

	staticRender: (environment: Environment) => ReactNode
	canHandleSource: (source: string, url: URL | undefined) => boolean | EmbedArtifacts
	renderEmbed: () => ReactNode
	populateEmbedData: (options: PopulateEmbedDataOptions<EmbedArtifacts>) => void

	// Exactly one of these *MUST* be defined
	discriminateBy?: SugaredDiscriminateBy
	discriminateByScalar?: SugaredDiscriminateByScalar
}

export type NormalizedEmbedHandlers = NormalizedDiscriminatedData<EmbedHandler>
