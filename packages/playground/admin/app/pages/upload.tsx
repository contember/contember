import { EntitySubTree } from '@contember/react-binding'
import * as React from 'react'
import { Binding, PersistButton } from '@app/lib/binding'
import { Slots } from '@app/lib/layout'
import { AudioField, FileField, ImageField, ImageRepeaterField, VideoField } from '@app/lib/form'


export const image = () => <>

	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<ImageField
				baseField="image"
				urlField="url"
				widthField="width"
				heightField="height"
				fileNameField="meta.fileName"
				fileSizeField="meta.fileSize"
				fileTypeField="meta.fileType"
				lastModifiedField="meta.lastModified"
				label="Image file"
				description="Some description of the image file."
			/>
		</EntitySubTree>
	</Binding>
</>

export const imageTrivial = () => <>

	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<ImageField
				baseField="imageTrivial"
				urlField="url"
				label="Image file"
				description="Some description of the image file."
			/>
		</EntitySubTree>
	</Binding>
</>

export const audio = () => <>

	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<AudioField
				baseField="audio"
				urlField="url"
				durationField="duration"
				fileNameField="meta.fileName"
				fileSizeField="meta.fileSize"
				fileTypeField="meta.fileType"
				lastModifiedField="meta.lastModified"
				label="Audio file"
				description="Some description of the audio file."
			/>
		</EntitySubTree>
	</Binding>
</>

export const video = () => <>

	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<VideoField
				baseField="video"
				urlField="url"
				durationField="duration"
				widthField="width"
				heightField="height"
				fileNameField="meta.fileName"
				fileSizeField="meta.fileSize"
				fileTypeField="meta.fileType"
				lastModifiedField="meta.lastModified"
				label="Video file"
				description="Some description of the video file."
			/>
		</EntitySubTree>
	</Binding>
</>

export const any = () => <>

	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<FileField
				baseField="file"
				urlField="url"
				fileNameField="meta.fileName"
				fileSizeField="meta.fileSize"
				fileTypeField="meta.fileType"
				lastModifiedField="meta.lastModified"
				label="Any file"
				description="Some description of a file."
			/>
		</EntitySubTree>
	</Binding>
</>


export const imageList = () => <>

	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<ImageRepeaterField
				field="imageList.items"
				baseField="image"
				sortableBy="order"
				urlField="url"
				widthField="width"
				heightField="height"
				fileNameField="meta.fileName"
				fileSizeField="meta.fileSize"
				fileTypeField="meta.fileType"
				lastModifiedField="meta.lastModified"
				label="Image file"
				description="Some description of the image file."
			/>
		</EntitySubTree>
	</Binding>
</>
