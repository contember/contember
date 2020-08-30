import { QueryLanguage, SugaredField, SugaredFieldProps, useRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from '../../../discrimination'
import { EmbedHandler, PopulateEmbedDataOptions, RenderEmbedProps } from './EmbedHandler'

class VimeoEmbedHandler implements EmbedHandler<string> {
	public readonly debugName = 'Vimeo'

	public readonly discriminateBy: SugaredDiscriminateBy | undefined = undefined
	public readonly discriminateByScalar: SugaredDiscriminateByScalar | undefined = undefined

	public constructor(private readonly options: VimeoEmbedHandler.Options) {
		if ('discriminateBy' in options) {
			this.discriminateBy = options.discriminateBy
		} else if ('discriminateByScalar' in options) {
			this.discriminateByScalar = options.discriminateByScalar
		}
	}

	public getStaticFields() {
		return <SugaredField field={this.options.vimeoIdField} />
	}

	public canHandleSource(source: string, url: URL | undefined): boolean | string {
		// This method deliberately biases towards the liberal and permissive.
		if (!url) {
			if (source.startsWith('vimeo.com')) {
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

		if (url.host.endsWith('vimeo.com')) {
			const matches = url.pathname.substr(1).match(/^(\d+)/)
			if (matches === null) {
				return false
			}
			return matches[1]
		}

		return false
	}

	public renderEmbed(props: RenderEmbedProps) {
		if (this.options.render) {
			return this.options.render(props)
		}
		return <VimeoEmbedHandler.Renderer vimeoIdField={this.options.vimeoIdField} entity={props.entity} />
	}

	public populateEmbedData({ batchUpdates, environment, embedArtifacts }: PopulateEmbedDataOptions<string>) {
		batchUpdates(getAccessor => {
			getAccessor()
				.getRelativeSingleField<string>(
					QueryLanguage.desugarRelativeSingleField(this.options.vimeoIdField, environment),
				)
				.updateValue?.(embedArtifacts)
		})
	}
}

namespace VimeoEmbedHandler {
	export type Options = {
		render?: (props: RenderEmbedProps) => React.ReactNode
		vimeoIdField: SugaredFieldProps['field']
	} & (
		| {
				discriminateBy: SugaredDiscriminateBy
		  }
		| {
				discriminateByScalar: SugaredDiscriminateByScalar
		  }
	)

	export interface RendererOptions extends RenderEmbedProps {
		vimeoIdField: SugaredFieldProps['field']
	}

	export const Renderer = React.memo(function VimeoRenderer(props: RendererOptions) {
		const vimeoId = useRelativeSingleField<string>(props.vimeoIdField).currentValue

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
