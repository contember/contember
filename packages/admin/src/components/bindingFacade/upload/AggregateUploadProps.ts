import { AudioFileUploadProps, DesugaredAudioFileUploadProps } from './AudioFileUploadProps'
import { DesugaredGenericFileUploadProps, GenericFileUploadProps } from './GenericFileUploadProps'
import { DesugaredImageFileUploadProps, ImageFileUploadProps } from './ImageFileUploadProps'
import { DesugaredVideoFileUploadProps, VideoFileUploadProps } from './VideoFileUploadProps'

export interface AggregateUploadProps
	extends GenericFileUploadProps,
		ImageFileUploadProps,
		AudioFileUploadProps,
		VideoFileUploadProps {}

export interface DesugaredAggregateUploadProps
	extends DesugaredGenericFileUploadProps,
		DesugaredImageFileUploadProps,
		DesugaredAudioFileUploadProps,
		DesugaredVideoFileUploadProps {}
