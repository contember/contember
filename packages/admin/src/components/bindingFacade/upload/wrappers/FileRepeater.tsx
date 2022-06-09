import type { SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import { Component, useEnvironment } from '@contember/binding'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import { getResolvedFileKinds, HybridFileKindProps } from '../templating'

export type FileRepeaterProps =
	& SugaredRelativeEntityList
	& HybridFileKindProps
	& Omit<FileInputPublicProps, 'label'>
	& {
		boxLabel?: ReactNode
		label: ReactNode
		sortableBy?: SugaredFieldProps['field']
		children?: ReactNode
	}

export const FileRepeater = Component<FileRepeaterProps>(
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
					'FileRepeater',
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
		return <BareFileRepeater {...props} fileKinds={fileKinds} />
	},
	(props, environment) => (
		<BareFileRepeater {...props} fileKinds={getResolvedFileKinds(props, environment, 'FileRepeater')} />
	),
	'FileRepeater',
)
