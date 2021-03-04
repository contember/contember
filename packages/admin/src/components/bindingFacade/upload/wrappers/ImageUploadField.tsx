import { Component } from '@contember/binding'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { ImageFieldView, ImageFieldViewProps } from '../../fieldViews'
import {
	FileDataPopulator,
	FileUrlDataPopulator,
	GenericFileMetadataPopulator,
	GenericFileMetadataPopulatorProps,
	ImageFileMetadataPopulator,
	ImageFileMetadataPopulatorProps,
} from '../fileDataPopulators'
import { UploadField } from '../core'
import { getImageFileDefaults } from '../stockFileKindDefaults'

export type ImageUploadFieldProps = SimpleRelativeSingleFieldProps &
	ImageFileMetadataPopulatorProps &
	GenericFileMetadataPopulatorProps & {
		additionalFileDataPopulators?: Iterable<FileDataPopulator>
		formatPreviewUrl?: ImageFieldViewProps['formatUrl']
		previewAlt?: string
		previewTitle?: string
	}

export const ImageUploadField: React.FunctionComponent<ImageUploadFieldProps> = Component(props => {
	const defaults = getImageFileDefaults(props.field)
	return (
		<UploadField
			{...props}
			fileUrlField={props.field}
			accept={defaults.accept}
			fileDataPopulators={[
				...(props.additionalFileDataPopulators || []),
				new FileUrlDataPopulator({ fileUrlField: props.field }),
				new GenericFileMetadataPopulator(props),
				new ImageFileMetadataPopulator(props),
			]}
			renderFile={() => (
				<ImageFieldView
					srcField={props.field}
					formatUrl={props.formatPreviewUrl}
					alt={props.previewAlt}
					title={props.previewTitle}
				/>
			)}
			renderFilePreview={(file, previewUrl) => (
				<img src={previewUrl} alt={props.previewAlt} title={props.previewTitle} />
			)}
		/>
	)
}, 'ImageUploadField')
