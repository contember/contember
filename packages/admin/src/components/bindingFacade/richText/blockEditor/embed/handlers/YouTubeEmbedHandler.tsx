import { SugaredField, SugaredFieldProps, useField } from '@contember/react-binding'
import { memo, ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../../../discrimination'
import type { EmbedHandler, PopulateEmbedDataOptions } from '../core'
import { parseUrl } from '../../../utils'

class YouTubeEmbedHandler implements EmbedHandler<string> {
	public readonly debugName = 'YouTube'
	public readonly discriminateBy: SugaredDiscriminateBy

	public constructor(private readonly options: YouTubeEmbedHandler.Options) {
		this.discriminateBy = options.discriminateBy
	}

	public staticRender() {
		return <SugaredField field={this.options.youTubeIdField} />
	}

	public handleSource(source: string, url: URL | undefined): undefined | string {
		// This method deliberately biases towards the liberal and permissive.
		if (!url) {
			if (source.startsWith('youtu')) {
				source = `www.${source}`
			}
			if (source.startsWith('www.')) {
				source = `https://${source}`
			}
			url = parseUrl(source)
			if (!url) {
				return undefined
			}
		}

		if (url.host.endsWith('youtube.com')) {
			const id = url.searchParams.get('v')

			return id ?? undefined
		} else if (url.host.endsWith('youtu.be')) {
			return url.pathname.substr(1)
		}

		return undefined
	}

	public renderEmbed() {
		if (this.options.render) {
			return this.options.render()
		}
		return <YouTubeEmbedHandler.Renderer youTubeIdField={this.options.youTubeIdField} />
	}

	public populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<string>) {
		entity.getField<string>(this.options.youTubeIdField).updateValue(embedArtifacts)
	}
}

namespace YouTubeEmbedHandler {
	export interface Options {
		render?: () => ReactNode
		youTubeIdField: SugaredFieldProps['field']
		discriminateBy: SugaredDiscriminateBy
	}

	export interface RendererOptions {
		youTubeIdField: SugaredFieldProps['field']
	}

	export const Renderer = memo(function YouTubeRenderer(props: RendererOptions) {
		const youTubeId = useField<string>(props.youTubeIdField).value

		if (youTubeId === null) {
			return null
		}
		return (
			<iframe
				width="560"
				height="315"
				src={`https://www.youtube-nocookie.com/embed/${youTubeId}`}
				referrerPolicy="no-referrer"
				allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
				loading="lazy"
				frameBorder="0"
				allowFullScreen
			/>
		)
	})
}

export { YouTubeEmbedHandler }
