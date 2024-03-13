import * as React from 'react'
import { ComponentType, ReactNode } from 'react'
import { Component, Field, SugaredRelativeSingleField, useEntity, useField } from '@contember/interface'
import { AudioFileDataExtractorProps, FileUrlDataExtractorProps, GenericFileMetadataExtractorProps, ImageFileDataExtractorProps, VideoFileDataExtractorProps } from '@contember/react-uploader'
import { formatBytes, formatDate, formatDuration } from '../../utils/formatting'
import { Button } from '../ui/button'
import { FileIcon, InfoIcon, TrashIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { formatImageResizeUrl } from '../../utils/formatImageResizeUrl'

export type UploadedImageViewProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& ImageFileDataExtractorProps
	& {
	DestroyAction?: ComponentType<{ children: ReactNode }>
}

export const UploadedImageView = Component<UploadedImageViewProps>(({ DestroyAction, ...props }) => {
	const url = useField<string>(props.urlField).value
	return (
		<div className="flex items-center justify-center h-40 w-40 rounded-md group">
			{url && <img src={formatImageResizeUrl(url)} className="max-w-full max-h-full" />}
			<FileActions DestroyAction={DestroyAction}>
							<ImageMetadata {...props} />
			</FileActions>
		</div>
	)
}, () => {
	// todo
	return null
})

const ImageMetadata = ({ heightField, widthField, ...props }: UploadedImageViewProps) => {
	return (
		<Metadata {...props}>
			<DimensionsMeta widthField={widthField} heightField={heightField} />
		</Metadata>
	)
}


export type UploadedAudioViewProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& AudioFileDataExtractorProps
	& {
		DestroyAction?: ComponentType<{ children: ReactNode }>
	}

export const UploadedAudioView = Component<UploadedAudioViewProps>(({ DestroyAction, ...props }) => {
	const url = useField<string>(props.urlField).value
	return (
		<div className="flex items-end justify-center h-40 max-w-80 rounded-md group">
			{url && <audio src={url} controls className="max-w-full max-h-full" controlsList="nodownload noremoteplayback noplaybackrate" />}
			<FileActions DestroyAction={DestroyAction}>
				<AudioMetadata {...props} />
			</FileActions>
		</div>
	)
}, () => {
	// todo
	return null
})

const AudioMetadata = ({ durationField, ...props }: UploadedAudioViewProps) => {
	return (
		<Metadata {...props}>
			<MetaField field={durationField} label="Duration:" format={formatDuration} />
		</Metadata>
	)
}


export type UploadedVideoViewProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& VideoFileDataExtractorProps
	& {
		DestroyAction?: ComponentType<{ children: ReactNode }>
	}

export const UploadedVideoView = Component<UploadedVideoViewProps>(({ DestroyAction, ...props }) => {
	const url = useField<string>(props.urlField).value
	return (
		<div className="flex items-center justify-center h-40 max-w-60 rounded-md group">
			{url && <video src={url} controls className="max-w-full max-h-full" controlsList="nodownload noremoteplayback noplaybackrate" />}
			<FileActions DestroyAction={DestroyAction}>
				<VideoMetadata {...props} />
			</FileActions>
		</div>
	)
}, () => {
	// todo
	return null
})

const VideoMetadata = ({ durationField, widthField, heightField, ...props }: UploadedVideoViewProps) => {
	return (
		<Metadata {...props}>
			<MetaField field={durationField} label="Duration:" format={formatDuration} />
			<DimensionsMeta widthField={widthField} heightField={heightField} />
		</Metadata>
	)
}

export type UploadedAnyViewProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& {
		DestroyAction?: ComponentType<{ children: ReactNode }>
	}

export const UploadedAnyView = Component<UploadedAnyViewProps>(({ DestroyAction, ...props }) => {
	const url = useField<string>(props.urlField).value
	return (
		<div className="flex h-40 w-40 rounded-md group">
			<a href={url ?? '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline overflow-hidden whitespace-nowrap overflow-ellipsis flex flex-col group/anchor flex-1 items-center justify-center">
				<FileIcon className="h-16 w-16 text-gray-400 group-hover/anchor:text-gray-500 transition-all" />
				{props.fileNameField ? <span><Field field={props.fileNameField} /></span> : null}
			</a>
			<FileActions DestroyAction={DestroyAction}>
				<Metadata {...props} />
			</FileActions>
		</div>
	)
}, () => {
	// todo
	return null
})


type MetadataProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& {
		children?: ReactNode
	}

const Metadata = ({ children, urlField, fileSizeField, fileNameField, lastModifiedField, fileTypeField }: MetadataProps) => {
	return (
		<div className="grid grid-cols-[6rem_1fr] gap-2">
			<MetaField field={fileSizeField} label="Size:" format={formatBytes} />
			<MetaField field={fileTypeField} label="Type:" />
			<MetaField field={fileNameField} label="File name:" />
			{children}
			<MetaField field={lastModifiedField} label="Date:" format={formatDate} />
			<MetaField field={urlField} label="URL:" format={url => (
				<a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline overflow-hidden whitespace-nowrap overflow-ellipsis">
					{url.replace(/^(.{15}).*(.{15})$/, '$1…$2')}
				</a>
			)} />
		</div>
	)
}

const DimensionsMeta = ({ widthField, heightField }: {
	widthField?: SugaredRelativeSingleField['field']
	heightField?: SugaredRelativeSingleField['field']
}) => {
	const entity = useEntity()
	if (!widthField || !heightField) {
		return null
	}
	const width = entity.getField<number>(widthField).value
	const height = entity.getField<number>(heightField).value

	return (
		<>
			<span className="font-semibold text-right">Dimensions:</span>
			<span>{width} x {height} px</span>
		</>
	)

}

const MetaField = ({ field, label, format = it => it }: {
	field?: SugaredRelativeSingleField['field']
	label: ReactNode
	format?: (value: any) => ReactNode
}) => {
	const entity = useEntity()
	return field ? (
		<>
			<span className="font-semibold text-right">{label}</span>
			<span>
				{format(entity.getField(field).value)}
			</span>
		</>
	) : null
}


const FileActions = ({ DestroyAction, children }: {
	children: ReactNode
	DestroyAction?: ComponentType<{ children: ReactNode }>
}) => {
	return (
		<div className="absolute -top-2 -right-1 p-0.5 bg-gray-200 border border-gray-300 rounded shadow flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
			<Popover>
				<PopoverTrigger asChild>
					<Button variant={'ghost'} size={'sm'} className={'p-0.5 h-5 w-5'}>
						<InfoIcon className="h-3 w-3" />
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<div className="text-sm">
						{children}
					</div>
				</PopoverContent>
			</Popover>
			{DestroyAction && <DestroyAction>
				<Button variant={'ghost'} size={'sm'} className={'p-0.5 h-5 w-5 text-red-500'}>
					<TrashIcon className="h-3 w-3" />
				</Button>
			</DestroyAction>}
		</div>
	)
}
