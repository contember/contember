import { SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import { memo, ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../../../discrimination'
import type { EmbedHandler, PopulateEmbedDataOptions } from '../core'

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

	public canHandleSource(source: string, url: URL | undefined): boolean | SpotifyEmbedHandler.Artifacts {
		// This method deliberately biases towards the liberal and permissive.
		if (!url) {
			if (source.startsWith('<iframe')) {
				const parser = new DOMParser()
				try {
					const { body } = parser.parseFromString(source, 'text/html')
					if (body.children.length === 1 && body.children[0] instanceof HTMLIFrameElement) {
						const iFrame = body.children[0]
						source = iFrame.src
					}
				} catch (_) {
					return false
				}
			}
			if (source.startsWith('open.spotify.com')) {
				source = `https://${source}`
			}
			try {
				url = new URL(source)
			} catch {
				return false
			}
		}

		if (url.host.endsWith('open.spotify.com')) {
			const matches = url.pathname.match(/^\/(embed\/)?(.+)\/(.+)$/)

			if (!matches) {
				return false
			}
			return {
				type: matches[2],
				id: matches[3],
			}
		}

		return false
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
