import { SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from '../../../../discrimination'
import { EmbedHandler, PopulateEmbedDataOptions } from '../core'

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

	public staticRender() {
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

	public renderEmbed() {
		if (this.options.render) {
			return this.options.render()
		}
		return <GoogleFormEmbedHandler.Renderer googleFormIdField={this.options.googleFormIdField} />
	}

	public populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<string>) {
		entity.getField<string>(this.options.googleFormIdField).updateValue(embedArtifacts)
	}
}

namespace GoogleFormEmbedHandler {
	export type Options = {
		nonEmbedLinkWarning?: string
		render?: () => ReactNode
		googleFormIdField: SugaredFieldProps['field']
	} & (
		| {
				discriminateBy: SugaredDiscriminateBy
		  }
		| {
				discriminateByScalar: SugaredDiscriminateByScalar
		  }
	)

	export interface RendererOptions {
		googleFormIdField: SugaredFieldProps['field']
	}

	export const Renderer = memo(function GoogleFormRenderer(props: RendererOptions) {
		const googleFormId = useField<string>(props.googleFormIdField).value

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
