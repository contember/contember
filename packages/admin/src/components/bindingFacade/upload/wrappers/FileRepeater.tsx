import type { SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import { Component, useEnvironment } from '@contember/binding'
import type { FormGroupProps } from '@contember/ui'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import type { RepeaterContainerPublicProps } from '../../collections'
import { BareFileRepeater } from '../internalComponents'
import type { FullFileKind } from '../interfaces'
import { getResolvedFileKinds } from '../templating'

export interface FileRepeaterProps
	extends SugaredRelativeEntityList,
		RepeaterContainerPublicProps,
		Pick<FormGroupProps, 'description' | 'labelDescription'>,
		Partial<FullFileKind> {
	addButtonSubText?: ReactNode
	label: ReactNode
	sortableBy?: SugaredFieldProps['field']
	discriminationField?: SugaredFieldProps['field']
	children?: ReactNode
}

export const FileRepeater = Component<FileRepeaterProps>(
	({
		acceptFile,
		acceptMimeTypes,
		children,
		discriminationField,
		extractors,
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
