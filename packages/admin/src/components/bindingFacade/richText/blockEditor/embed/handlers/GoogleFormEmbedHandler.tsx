import { SugaredField, SugaredFieldProps, useRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from '../../../../discrimination'
import { EmbedHandler, PopulateEmbedDataOptions, RenderEmbedProps } from '../core'

class GoogleFormEmbedHandler implements EmbedHandler<string> {
	public readonly debugName = 'GoogleForm'

	public readonly discriminateBy: SugaredDiscriminateBy | undefined = undefined
	public readonly discriminateByScalar: SugaredDiscriminateByScalar | undefined = undefined

	public constructor(private readonly options: GoogleFormEmbedHandler.Options) {
		if ('discriminateBy' in options) {
			this.discriminateBy = options.discriminateBy
		} else if ('discriminateByScalar' in options) {
			this.discriminateByScalar = options.discriminateByScalar
		}
	}

	public getStaticFields() {
		return <SugaredField field={this.options.googleFormIdField} />
	}

	public canHandleSource(source: string, url: URL | undefined): boolean | string {
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
			if (source.startsWith('docs.google.com')) {
				source = `https://${source}`
			}
			try {
				url = new URL(source)
			} catch {
				return false
			}
		}

		if (url.host.endsWith('docs.google.com')) {
			const matches = url.pathname.match(/^\/forms\/d(\/e)?\/([^\/]+).*$/)

			if (!matches) {
				return false
			}
			if (matches[1] === undefined) {
				alert(
					this.options.nonEmbedLinkWarning ??
						'Detected a Google Form but the link supplied cannot be reliably embedded.\n\n' +
							"If you wish to embed the form, please return to Google Forms and use the 'Send' button in the top right corner to get a correct link.",
				)
				return false
			}
			return matches[2]
		}

		return false
	}

	public renderEmbed(props: RenderEmbedProps) {
		if (this.options.render) {
			return this.options.render(props)
		}
		return <GoogleFormEmbedHandler.Renderer googleFormIdField={this.options.googleFormIdField} entity={props.entity} />
	}

	public populateEmbedData({ batchUpdates, embedArtifacts }: PopulateEmbedDataOptions<string>) {
		batchUpdates(getAccessor => {
			getAccessor()
				.getSingleField<string>(this.options.googleFormIdField)
				.updateValue?.(embedArtifacts)
		})
	}
}

namespace GoogleFormEmbedHandler {
	export type Options = {
		nonEmbedLinkWarning?: string
		render?: (props: RenderEmbedProps) => React.ReactNode
		googleFormIdField: SugaredFieldProps['field']
	} & (
		| {
				discriminateBy: SugaredDiscriminateBy
		  }
		| {
				discriminateByScalar: SugaredDiscriminateByScalar
		  }
	)

	export interface RendererOptions extends RenderEmbedProps {
		googleFormIdField: SugaredFieldProps['field']
	}

	export const Renderer = React.memo(function GoogleFormRenderer(props: RendererOptions) {
		const googleFormId = useRelativeSingleField<string>(props.googleFormIdField).currentValue

		if (googleFormId === null) {
			return null
		}
		return (
			<iframe
				src={`https://docs.google.com/forms/d/e/${googleFormId}/viewform?embedded=true`}
				width="640"
				height="640"
				frameBorder="0"
				loading="lazy"
				allowFullScreen
			/>
		)
	})
}

export { GoogleFormEmbedHandler }
