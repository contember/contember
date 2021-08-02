import { SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import { memo, ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../../../discrimination'
import type { EmbedHandler, PopulateEmbedDataOptions } from '../core'

class SoundCloudEmbedHandler implements EmbedHandler<string> {
	public readonly debugName = 'SoundCloud'
	public readonly discriminateBy: SugaredDiscriminateBy

	public constructor(private readonly options: SoundCloudEmbedHandler.Options) {
		this.discriminateBy = options.discriminateBy
	}

	public staticRender() {
		return <SugaredField field={this.options.soundCloudIdField} />
	}

	public canHandleSource(source: string, url: URL | undefined): boolean | string {
		// This method deliberately biases towards the liberal and permissive.
		if (url) {
			return false
		}

		if (source.startsWith('<iframe')) {
			const parser = new DOMParser()
			try {
				const { body } = parser.parseFromString(source, 'text/html')
				const iFrame = body.querySelector('iframe')
				if (iFrame instanceof HTMLIFrameElement) {
					source = iFrame.src
				}
			} catch (_) {
				return false
			}
		}
		try {
			url = new URL(source)
		} catch {
			return false
		}

		if (url.host.endsWith('w.soundcloud.com')) {
			const trackUrl = url.searchParams.get('url') || ''
			const matches = trackUrl.match(/^https:\/\/api\.soundcloud\.com\/tracks\/([^\/]*)$/)

			if (!matches) {
				return false
			}
			return matches[1]
		}

		return false
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
