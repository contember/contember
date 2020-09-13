import { SugaredField, SugaredFieldProps, useRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from '../../../../discrimination'
import { EmbedHandler, PopulateEmbedDataOptions, RenderEmbedProps } from '../core'

class YouTubeEmbedHandler implements EmbedHandler<string> {
	public readonly debugName = 'YouTube'

	public readonly discriminateBy: SugaredDiscriminateBy | undefined = undefined
	public readonly discriminateByScalar: SugaredDiscriminateByScalar | undefined = undefined

	public constructor(private readonly options: YouTubeEmbedHandler.Options) {
		if ('discriminateBy' in options) {
			this.discriminateBy = options.discriminateBy
		} else if ('discriminateByScalar' in options) {
			this.discriminateByScalar = options.discriminateByScalar
		}
	}

	public getStaticFields() {
		return <SugaredField field={this.options.youTubeIdField} />
	}

	public canHandleSource(source: string, url: URL | undefined): boolean | string {
		// This method deliberately biases towards the liberal and permissive.
		if (!url) {
			if (source.startsWith('youtu')) {
				source = `www.${source}`
			}
			if (source.startsWith('www.')) {
				source = `https://${source}`
			}
			try {
				url = new URL(source)
			} catch {
				return false
			}
		}

		if (url.host.endsWith('youtube.com')) {
			const id = url.searchParams.get('v')

			return id ?? false
		} else if (url.host.endsWith('youtu.be')) {
			return url.pathname.substr(1)
		}

		return false
	}

	public renderEmbed(props: RenderEmbedProps) {
		if (this.options.render) {
			return this.options.render(props)
		}
		return <YouTubeEmbedHandler.Renderer youTubeIdField={this.options.youTubeIdField} entity={props.entity} />
	}

	public populateEmbedData({ batchUpdates, embedArtifacts }: PopulateEmbedDataOptions<string>) {
		batchUpdates(getAccessor => {
			getAccessor().getSingleField<string>(this.options.youTubeIdField).updateValue?.(embedArtifacts)
		})
	}
}

namespace YouTubeEmbedHandler {
	export type Options = {
		render?: (props: RenderEmbedProps) => React.ReactNode
		youTubeIdField: SugaredFieldProps['field']
	} & (
		| {
				discriminateBy: SugaredDiscriminateBy
		  }
		| {
				discriminateByScalar: SugaredDiscriminateByScalar
		  }
	)

	export interface RendererOptions extends RenderEmbedProps {
		youTubeIdField: SugaredFieldProps['field']
	}

	export const Renderer = React.memo(function YouTubeRenderer(props: RendererOptions) {
		const youTubeId = useRelativeSingleField<string>(props.youTubeIdField).currentValue

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
