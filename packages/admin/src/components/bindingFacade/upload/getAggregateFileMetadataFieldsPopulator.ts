import { EntityAccessor } from '@contember/binding'
import { DesugaredAggregateUploadProps } from './AggregateUploadProps'
import { populateAudioFileMetadataFields } from './populateAudioFileMetadataFields'
import { populateGenericFileMetadataFields } from './populateGenericFileMetadataFields'
import { populateImageFileMetadataFields } from './populateImageFileMetadataFields'
import { populateVideoFileMetadataFields } from './populateVideoFileMetadataFields'
import { isAudio, isImage, isVideo } from './utils'

export type FileMetadataFieldsPopulator = (parentEntity: EntityAccessor) => void

export const getAggregateFileMetadataFieldsPopulator = (
	file: File,
	previewUrl: string,
	props: DesugaredAggregateUploadProps,
): Promise<FileMetadataFieldsPopulator> => {
	if (isImage(file)) {
		if (props.heightField || props.widthField) {
			return new Promise((resolve, reject) => {
				const image = new Image()
				image.addEventListener('load', () => {
					resolve(parentEntity => {
						parentEntity.batchUpdates(getAccessor => {
							populateImageFileMetadataFields(getAccessor(), image, props)
							populateGenericFileMetadataFields(getAccessor(), file, props)
						})
					})
				})
				image.addEventListener('error', () => {
					reject()
				})
				image.src = previewUrl
			})
		}
	} else if (isVideo(file)) {
		if (props.durationField || props.heightField || props.widthField) {
			return new Promise((resolve, reject) => {
				const video = document.createElement('video')
				video.addEventListener('canplay', () => {
					resolve(parentEntity => {
						parentEntity.batchUpdates(getAccessor => {
							populateVideoFileMetadataFields(getAccessor(), video, props)
							populateGenericFileMetadataFields(getAccessor(), file, props)
						})
					})
				})
				video.addEventListener('error', () => {
					reject()
				})
				video.src = previewUrl
			})
		}
	} else if (isAudio(file)) {
		return new Promise((resolve, reject) => {
			const audio = document.createElement('audio')
			audio.addEventListener('canplay', () => {
				resolve(parentEntity => {
					parentEntity.batchUpdates(getAccessor => {
						populateAudioFileMetadataFields(getAccessor(), audio, props)
						populateGenericFileMetadataFields(getAccessor(), file, props)
					})
				})
			})
			audio.addEventListener('error', () => {
				reject()
			})
			audio.src = previewUrl
		})
	}
	return new Promise(resolve => {
		resolve(parentEntity => {
			populateGenericFileMetadataFields(parentEntity, file, props)
		})
	})
}
