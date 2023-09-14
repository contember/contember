import { SugaredField, SugaredFieldProps, useField } from '@contember/react-binding'
import { memo, ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../../../discrimination'
import type { EmbedHandler, PopulateEmbedDataOptions } from '../core'
import { parseUrl } from '../../../utils'

class VimeoEmbedHandler implements EmbedHandler<string> {
	public readonly debugName = 'Vimeo'

	public readonly discriminateBy: SugaredDiscriminateBy

	public constructor(private readonly options: VimeoEmbedHandler.Options) {
		this.discriminateBy = options.discriminateBy
	}

	public staticRender() {
		return <SugaredField field={this.options.vimeoIdField} />
	}

	public handleSource(source: string, url: URL | undefined): undefined | string {
		// This method deliberately biases towards the liberal and permissive.
		if (!url) {
			if (source.startsWith('vimeo.com')) {
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

		if (!url.host.endsWith('vimeo.com')) {
			return undefined
		}
		const matches = url.pathname.substr(1).match(/^(\d+)/)
		if (matches === null) {
			return undefined
		}
		return matches[1]
	}

	public renderEmbed() {
		if (this.options.render) {
			return this.options.render()
		}
		return <VimeoEmbedHandler.Renderer vimeoIdField={this.options.vimeoIdField} />
	}

	public populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<string>) {
		entity.getField<string>(this.options.vimeoIdField).updateValue(embedArtifacts)
	}
}

namespace VimeoEmbedHandler {
	export interface Options {
		render?: () => ReactNode
		vimeoIdField: SugaredFieldProps['field']
		discriminateBy: SugaredDiscriminateBy
	}

	export interface RendererOptions {
		vimeoIdField: SugaredFieldProps['field']
	}

	export const Renderer = memo(function VimeoRenderer(props: RendererOptions) {
		const vimeoId = useField<string>(props.vimeoIdField).value

		if (vimeoId === null) {
			return null
		}
		return (
			<iframe
				width="560"
				height="315"
				src={`https://player.vimeo.com/video/${vimeoId}`}
				referrerPolicy="no-referrer"
				allow="autoplay; fullscreen"
				loading="lazy"
				frameBorder="0"
				allowFullScreen
			/>
		)
	})
}

export { VimeoEmbedHandler }
