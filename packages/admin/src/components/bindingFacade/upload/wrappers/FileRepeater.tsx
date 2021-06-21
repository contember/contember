import type { SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import { Component, useEnvironment } from '@contember/binding'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import { getResolvedFileKinds, HybridFileKindProps } from '../templating'

export interface FileRepeaterProps extends SugaredRelativeEntityList, FileInputPublicProps, HybridFileKindProps {
	sortableBy?: SugaredFieldProps['field']
	children?: ReactNode
}

export const FileRepeater = Component<FileRepeaterProps>(
	({
		acceptFile,
		acceptMimeTypes,
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
