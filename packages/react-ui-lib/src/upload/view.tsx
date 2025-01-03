import * as React from 'react'
import { ComponentType, ReactElement, ReactNode } from 'react'
import { Component, Field, FieldView, StaticRender, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/interface'
import {
	AudioFileDataExtractorProps,
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
	ImageFileDataExtractorProps,
	UploaderBase,
	VideoFileDataExtractorProps,
} from '@contember/react-uploader'
import { formatBytes, formatDate, formatDuration } from '../formatting'
import { Button } from '../ui/button'
import { EditIcon, FileIcon, InfoIcon, TrashIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { formatImageResizeUrl } from '../images'

export type BaseFileViewProps = {
	baseField?: SugaredRelativeSingleEntity['field']
	actions?: ReactNode
	edit?: ReactNode
	noDestroy?: boolean
	DestroyAction?: ComponentType<{ children: ReactElement }>
}


export type UploadedImageViewProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& ImageFileDataExtractorProps
	& BaseFileViewProps

export const UploadedImageView = Component<UploadedImageViewProps>(({ DestroyAction, edit, actions, baseField,  ...props }) => (
	<div className="flex items-center justify-center h-40 rounded-md group relative">
		<UploaderBase baseField={baseField}>
			<ImagePreview urlField={props.urlField} />
		</UploaderBase>
		<FileActions baseField={baseField} DestroyAction={DestroyAction} metadata={<ImageMetadata {...props} />} edit={edit} actions={actions} />
	</div>
))

const ImagePreview = Component((props: FileUrlDataExtractorProps) => (
	<FieldView<string> field={props.urlField} render={({ value: url }) => (
		!url ? null : <img src={formatImageResizeUrl(url, { width: 400 })} className="max-w-full max-h-full" />
	)} />
))

const ImageMetadata = Component(({ heightField, widthField, ...props }: UploadedImageViewProps) => (
	<Metadata {...props}>
		<DimensionsMeta widthField={widthField} heightField={heightField} />
	</Metadata>
))



export type UploadedAudioViewProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& AudioFileDataExtractorProps
	& BaseFileViewProps

export const UploadedAudioView = Component<UploadedAudioViewProps>(({ DestroyAction, edit, actions, baseField, ...props }) => (
	<div className="flex items-end justify-center h-40 max-w-80 rounded-md group">
		<UploaderBase baseField={baseField}>
			<AudioPreview urlField={props.urlField} />
		</UploaderBase>
		<FileActions baseField={baseField} DestroyAction={DestroyAction} metadata={<AudioMetadata {...props} />} edit={edit}
						 actions={actions} />
	</div>
))

const AudioPreview = Component(({ urlField }: FileUrlDataExtractorProps) => (
	<FieldView<string> field={urlField} render={({ value: url }) => (
		!url ? null : <audio src={url} controls className="max-w-full max-h-full" controlsList="nodownload noremoteplayback noplaybackrate" />
	)} />
))

const AudioMetadata = Component(({ durationField, ...props }: UploadedAudioViewProps) => (
	<Metadata {...props}>
		<MetaField field={durationField} label="Duration:" format={formatDuration} />
	</Metadata>
))



export type UploadedVideoViewProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& VideoFileDataExtractorProps
	& BaseFileViewProps

export const UploadedVideoView = Component<UploadedVideoViewProps>(({ DestroyAction, edit, actions, baseField, ...props }) => (
	<div className="flex items-center justify-center h-40 max-w-60 rounded-md group">
		<UploaderBase baseField={baseField}>
			<VideoPreview urlField={props.urlField} />
		</UploaderBase>
		<FileActions baseField={baseField} DestroyAction={DestroyAction} metadata={<VideoMetadata {...props} />} edit={edit} actions={actions} />
	</div>
))

const VideoPreview = Component(({ urlField }: FileUrlDataExtractorProps) => (
	<FieldView<string> field={urlField} render={({ value: url }) => (
		!url ? null : <video src={url} controls className="max-w-full max-h-full" controlsList="nodownload noremoteplayback noplaybackrate" />
	)} />
))

const VideoMetadata = Component(({ durationField, widthField, heightField, ...props }: UploadedVideoViewProps) => (
	<Metadata {...props}>
		<MetaField field={durationField} label="Duration:" format={formatDuration} />
		<DimensionsMeta widthField={widthField} heightField={heightField} />
	</Metadata>
))



export type UploadedAnyViewProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& BaseFileViewProps

export const UploadedAnyView = Component<UploadedAnyViewProps>(({ DestroyAction, edit, actions, baseField, ...props }) => (
	<div className="flex h-40 w-40 rounded-md group">
		<UploaderBase baseField={baseField}>
			<AnyFilePreview {...props} />
		</UploaderBase>
		<FileActions baseField={baseField} DestroyAction={DestroyAction} metadata={<Metadata {...props} />} edit={edit} actions={actions} />
	</div>
))

const AnyFilePreview = Component(({ urlField, fileNameField }: FileUrlDataExtractorProps & GenericFileMetadataExtractorProps) => <>
	<FieldView<string> field={urlField} render={({ value: url }) => (
		url ? <a href={url ?? '#'} target="_blank" rel="noreferrer"
			className="text-blue-600 hover:text-blue-700 underline overflow-hidden whitespace-nowrap overflow-ellipsis flex flex-col group/anchor flex-1 items-center justify-center">
			<FileIcon className="h-16 w-16 text-gray-400 group-hover/anchor:text-gray-500 transition-all" />
			{fileNameField ? <span><Field field={fileNameField} /></span> : null}
		</a> : null)} />
	<StaticRender>{fileNameField ? <span><Field field={fileNameField} /></span> : null}</StaticRender>
</>)


type MetadataProps =
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& {
		children?: ReactNode
	}

const Metadata = Component(({ children, urlField, fileSizeField, fileNameField, lastModifiedField, fileTypeField }: MetadataProps) => (
	<div className="grid grid-cols-[6rem_1fr] gap-2">
		<MetaField field={fileSizeField} label="Size:" format={formatBytes} />
		<MetaField field={fileTypeField} label="Type:" />
		<MetaField field={fileNameField} label="File name:" />
		{children}
		<MetaField field={lastModifiedField} label="Date:" format={formatDate} />
		<MetaField field={urlField} label="URL:" format={url => (
			<a href={url} target="_blank" rel="noreferrer"
				   className="text-blue-600 underline overflow-hidden whitespace-nowrap overflow-ellipsis">
				{url.replace(/^(.{15}).*(.{15})$/, '$1…$2')}
			</a>
		)} />
	</div>
))

const DimensionsMeta = Component(({ widthField, heightField }: {
	widthField?: SugaredRelativeSingleField['field']
	heightField?: SugaredRelativeSingleField['field']
}) => {
	if (!widthField || !heightField) {
		return null
	}
	return <FieldView<number, number> fields={[widthField, heightField]} render={(width, height) => <>
		<span className="font-semibold text-right">Dimensions:</span>
		<span>{width.value} x {height.value} px</span>
	</>}/>
})

interface MetaFieldProps {
	field?: SugaredRelativeSingleField['field']
	label: ReactNode
	format?: (value: any) => ReactNode
}
const MetaField = Component<MetaFieldProps>(({ field, label, format = it => it }) => (
	!field ? null : <FieldView<any> field={field} render={value => <>
		<span className="font-semibold text-right">{label}</span>
		<span>{format(value.value)}</span>
	</>} />
))


const FileActions = Component(({ DestroyAction, metadata, actions, edit, baseField, noDestroy }: {
	metadata?: ReactNode
} & BaseFileViewProps) => {
	return (
		<div className="absolute -top-2 -right-1 p-0.5 bg-gray-200 border border-gray-300 rounded shadow flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
			{actions}
			{edit && <Popover>
				<PopoverTrigger asChild>
					<Button variant={'ghost'} size={'sm'} className={'p-0.5 h-5 w-5'} onClick={e => e.stopPropagation()}>
						<EditIcon className="h-4 w-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					{edit}
				</PopoverContent>
			</Popover>}
			<UploaderBase baseField={baseField}>
				{metadata && <Popover>
					<PopoverTrigger asChild>
						<Button variant={'ghost'} size={'sm'} className={'p-0.5 h-5 w-5'} onClick={e => e.stopPropagation()}>
							<InfoIcon className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent>
						<div className="text-sm">
							{metadata}
						</div>
					</PopoverContent>
				</Popover>}
				{!noDestroy && DestroyAction ? <DestroyAction>
					<Button variant={'ghost'} size={'sm'} className={'p-0.5 h-5 w-5 text-red-500'}>
						<TrashIcon className="h-4 w-4" />
					</Button>
				</DestroyAction> : null}
			</UploaderBase>
		</div>
	)
})
