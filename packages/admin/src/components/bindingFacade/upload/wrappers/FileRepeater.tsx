import type { SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import { Component, useEnvironment } from '@contember/binding'
import type { FormGroupProps } from '@contember/ui'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import type { RepeaterContainerPublicProps } from '../../collections'
import { BareFileRepeater } from '../BareFileRepeater'
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
	props => {
		const environment = useEnvironment()
		const fileKinds = useMemo(
			() =>
				getResolvedFileKinds(
					{
						acceptFile: props.acceptFile,
						acceptMimeTypes: props.acceptMimeTypes,
						children: props.children,
						discriminationField: props.discriminationField,
						extractors: props.extractors,
						renderFilePreview: props.renderFilePreview,
						renderUploadedFile: props.renderUploadedFile,
						uploader: props.uploader,
					},
					environment,
				),
			[
				props.acceptFile,
				props.acceptMimeTypes,
				props.children,
				props.discriminationField,
				props.extractors,
				props.renderFilePreview,
				props.renderUploadedFile,
				props.uploader,
				environment,
			],
		)
		return <BareFileRepeater {...props} fileKinds={fileKinds} />
	},
	(props, environment) => {
		const fileKinds = getResolvedFileKinds(props, environment)
		return <BareFileRepeater {...props} fileKinds={fileKinds} />
	},
	'FileRepeater',
)
