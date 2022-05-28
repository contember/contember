import { SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import { memo, ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../../../discrimination'
import type { EmbedHandler, PopulateEmbedDataOptions } from '../core'
import { parseIframeSrc, parseUrl } from '../../../utils'

class SpotifyEmbedHandler implements EmbedHandler<SpotifyEmbedHandler.Artifacts> {
	public readonly debugName = 'Spotify'
	public readonly discriminateBy: SugaredDiscriminateBy

	public constructor(private readonly options: SpotifyEmbedHandler.Options) {
		this.discriminateBy = options.discriminateBy
	}

	public staticRender() {
		return (
			<>
				<SugaredField field={this.options.spotifyTypeField} />
				<SugaredField field={this.options.spotifyIdField} />
			</>
		)
	}

	public handleSource(source: string, url: URL | undefined): undefined | SpotifyEmbedHandler.Artifacts {
		// This method deliberately biases towards the liberal and permissive.
		if (!url) {
			source = parseIframeSrc(source) ?? source
			if (source.startsWith('open.spotify.com')) {
				source = `https://${source}`
			}
			url = parseUrl(source)
			if (!url) {
				return undefined
			}
		}

		if (!url.host.endsWith('open.spotify.com')) {
			return undefined
		}

		const matches = url.pathname.match(/^\/(embed\/)?(.+)\/(.+)$/)

		if (!matches) {
			return undefined
		}
		return {
			type: matches[2],
			id: matches[3],
		}
	}

	public renderEmbed() {
		if (this.options.render) {
			return this.options.render()
		}
		return (
			<SpotifyEmbedHandler.Renderer
				spotifyTypeField={this.options.spotifyTypeField}
				spotifyIdField={this.options.spotifyIdField}
			/>
		)
	}

	public populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<SpotifyEmbedHandler.Artifacts>) {
		entity.getField<string>(this.options.spotifyTypeField).updateValue(embedArtifacts.type)
		entity.getField<string>(this.options.spotifyIdField).updateValue(embedArtifacts.id)
	}
}

namespace SpotifyEmbedHandler {
	export interface Artifacts {
		type: string
		id: string
	}

	export interface Options {
		render?: () => ReactNode
		spotifyTypeField: SugaredFieldProps['field']
		spotifyIdField: SugaredFieldProps['field']
		discriminateBy: SugaredDiscriminateBy
	}

	export interface RendererOptions {
		spotifyTypeField: SugaredFieldProps['field']
		spotifyIdField: SugaredFieldProps['field']
	}

	export const Renderer = memo(function SpotifyRenderer(props: RendererOptions) {
		const spotifyType = useField<string>(props.spotifyTypeField).value
		const spotifyId = useField<string>(props.spotifyIdField).value

		if (spotifyType === null || spotifyId === null) {
			return null
		}
		return (
			<iframe
				src={`https://open.spotify.com/embed/${spotifyType}/${spotifyId}`}
				width="100%"
				height="232"
				frameBorder="0"
				allow="encrypted-media"
			/>
		)
	})
}

export { SpotifyEmbedHandler }
