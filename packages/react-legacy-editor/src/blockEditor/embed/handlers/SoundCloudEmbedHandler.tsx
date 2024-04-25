import { SugaredField, SugaredFieldProps, useField } from '@contember/react-binding'
import { memo, ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../../../discrimination'
import type { EmbedHandler, PopulateEmbedDataOptions } from '../core'
import { parseIframeSrc, parseUrl } from '../../../utils'

class SoundCloudEmbedHandler implements EmbedHandler<string> {
	public readonly debugName = 'SoundCloud'
	public readonly discriminateBy: SugaredDiscriminateBy

	public constructor(private readonly options: SoundCloudEmbedHandler.Options) {
		this.discriminateBy = options.discriminateBy
	}

	public staticRender() {
		return <SugaredField field={this.options.soundCloudIdField} />
	}

	public handleSource(source: string, url: URL | undefined): undefined | string {
		// Regular url from url bar is ignored intentionally since it doesn't contain track id required for embed/iframe src attribute
		if (url) {
			return undefined
		}
		const iframeSrc = parseIframeSrc(source)
		const iframeUrl = iframeSrc ? parseUrl(iframeSrc) : undefined
		if (!iframeUrl) {
			return undefined
		}

		if (!iframeUrl.host.endsWith('w.soundcloud.com')) {
			return undefined
		}
		const trackUrl = iframeUrl.searchParams.get('url') || ''
		const matches = trackUrl.match(/^https:\/\/api\.soundcloud\.com\/tracks\/([^\/]*)$/)

		if (!matches) {
			return undefined
		}
		return matches[1]
	}

	public renderEmbed() {
		if (this.options.render) {
			return this.options.render()
		}
		return <SoundCloudEmbedHandler.Renderer soundCloudIdField={this.options.soundCloudIdField} />
	}

	public populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<string>) {
		entity.getField<string>(this.options.soundCloudIdField).updateValue(embedArtifacts)
	}
}

namespace SoundCloudEmbedHandler {
	export interface Options {
		render?: () => ReactNode
		soundCloudIdField: SugaredFieldProps['field']
		discriminateBy: SugaredDiscriminateBy
	}

	export interface RendererOptions {
		soundCloudIdField: SugaredFieldProps['field']
	}

	export const Renderer = memo(function SoundCloudRenderer(props: RendererOptions) {
		const soundCloudId = useField<string>(props.soundCloudIdField).value

		if (soundCloudId === null) {
			return null
		}
		return (
			<iframe
				width="100%"
				height="166"
				scrolling="no"
				frameBorder="no"
				allow="autoplay"
				src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${soundCloudId}`}
			/>
		)
	})
}

export { SoundCloudEmbedHandler }
