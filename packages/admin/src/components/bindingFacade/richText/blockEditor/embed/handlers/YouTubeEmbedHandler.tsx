import { SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from '../../../../discrimination'
import { EmbedHandler, PopulateEmbedDataOptions } from '../core'

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

	public staticRender() {
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
	export type Options = {
		render?: () => ReactNode
		youTubeIdField: SugaredFieldProps['field']
	} & (
		| {
				discriminateBy: SugaredDiscriminateBy
		  }
		| {
				discriminateByScalar: SugaredDiscriminateByScalar
		  }
	)

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
