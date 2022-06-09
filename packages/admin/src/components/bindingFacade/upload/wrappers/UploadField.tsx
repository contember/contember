import { Component, useEnvironment } from '@contember/binding'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import type { FileInputPublicProps } from '../internalComponents'
import { BareUploadField } from '../internalComponents'
import { getResolvedFileKinds, HybridFileKindProps } from '../templating'

export type UploadFieldProps =
	& FileInputPublicProps
	&	HybridFileKindProps
	& {
		children?: ReactNode
	}

export const UploadField = Component<UploadFieldProps>(
	({
		acceptFile,
		acceptMimeTypes,
		baseEntity,
		children,
		discriminationField,
		extractors,
		hasUploadedFile,
		renderFilePreview,
		renderUploadedFile,
		uploader,
		...props
	}) => {
		const environment = useEnvironment()
		const fileKinds = useMemo(
			() =>
				getResolvedFileKinds(
					{
						acceptFile,
						acceptMimeTypes,
						baseEntity,
						children,
						discriminationField,
						extractors,
						hasUploadedFile,
						renderFilePreview,
						renderUploadedFile,
						uploader,
					},
					environment,
					'UploadField',
				),
			[
				acceptFile,
				acceptMimeTypes,
				baseEntity,
				children,
				discriminationField,
				extractors,
				hasUploadedFile,
				renderFilePreview,
				renderUploadedFile,
				uploader,
				environment,
			],
		)

		return <BareUploadField {...props} fileKinds={fileKinds} />
	},
	(props, environment) => (
		<BareUploadField {...props} fileKinds={getResolvedFileKinds(props, environment, 'UploadField')} />
	),
	'UploadField',
)
