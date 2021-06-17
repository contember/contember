// import { Component } from '@contember/binding'
// import type { FunctionComponent } from 'react'
// import type { SimpleRelativeSingleFieldProps } from '../../auxiliary'
// import { UploadField } from '../oldCore'
// import {
// 	FileDataPopulator,
// 	FileUrlDataPopulator,
// 	GenericFileMetadataPopulator,
// 	GenericFileMetadataPopulatorProps,
// 	VideoFileMetadataPopulator,
// 	VideoFileMetadataPopulatorProps,
// } from '../fileDataPopulators'
// import { getVideoFileDefaults } from '../stockFileKindDefaults'
//
// export type VideoUploadFieldProps = SimpleRelativeSingleFieldProps &
// 	VideoFileMetadataPopulatorProps &
// 	GenericFileMetadataPopulatorProps & {
// 		additionalFileDataPopulators?: Iterable<FileDataPopulator>
// 	}
//
// export const VideoUploadField: FunctionComponent<VideoUploadFieldProps> = Component(props => {
// 	const defaults = getVideoFileDefaults(props.field)
// 	return (
// 		<UploadField
// 			{...props}
// 			fileUrlField={props.field}
// 			accept={defaults.accept}
// 			fileDataPopulators={[
// 				...(props.additionalFileDataPopulators || []),
// 				new FileUrlDataPopulator({ fileUrlField: props.field }),
// 				new GenericFileMetadataPopulator(props),
// 				new VideoFileMetadataPopulator(props),
// 			]}
// 			renderFile={defaults.renderFile}
// 			renderFilePreview={defaults.renderFilePreview}
// 		/>
// 	)
// }, 'VideoUploadField')
export function VideoUploadField(props: any): any {}
