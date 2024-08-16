import { EntitySubTree, StaticRender, useEntity } from '@contember/react-binding'
import * as React from 'react'
import { useState } from 'react'
import { Binding, PersistButton } from '@app/lib/binding'
import { Slots } from '@app/lib/layout'
import { AudioField, FileField, ImageField, ImageRepeaterField, VideoField } from '@app/lib/form'
import { Dialog, DialogContent, DialogTrigger } from '@app/lib/ui/dialog'
import { Button } from '@app/lib/ui/button'
import { DataGrid, DataGridColumn, DataGridLoader, DataGridPagination, DataGridTable, DataGridTextColumn, DataGridTiles, DataGridToolbar } from '@app/lib/datagrid'
import { UploadedImageView, UploaderDropzoneAreaUI } from '@app/lib/upload'
import { UseEntity } from '@app/app/components/UseEntity'
import { EntityAccessor, Field } from '@contember/interface'
import { FileUrlDataExtractorProps, GenericFileMetadataExtractorProps, ImageFileDataExtractorProps } from '@contember/react-uploader'
import { UploadIcon } from 'lucide-react'
import { dict } from '@app/lib/dict'


const imageFields: FileUrlDataExtractorProps & GenericFileMetadataExtractorProps & ImageFileDataExtractorProps = {
	urlField: 'url',
	widthField: 'width',
	heightField: 'height',
	fileNameField: 'meta.fileName',
	fileSizeField: 'meta.fileSize',
	fileTypeField: 'meta.fileType',
	lastModifiedField: 'meta.lastModified',
}

const SelectImage = () => {
	const entity = useEntity()

	return <SelectImageInner connect={it => {
		entity.connectEntityAtField('image', it)
	}} closeOnSelect />
}

const SelectImageRepeater = () => {
	const entity = useEntity()

	return <SelectImageInner connect={it => {
		entity.getEntityList('imageList.items').createNewEntity(entity => {
			entity().connectEntityAtField('image', it)
		})
	}} />
}

const SelectImageInner = ({ connect, closeOnSelect }: { connect: (entity: EntityAccessor) => void; closeOnSelect?: boolean }) => {
	const [open, setOpen] = useState(false)
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" onClick={e => e.stopPropagation()}>Select image</Button>
			</DialogTrigger>
			<DialogContent className="max-w-[90vw]">
				<DataGrid entities="UploadImage">
					<DataGridToolbar></DataGridToolbar>
					<DataGridLoader>
						<DataGridTiles className="md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
							<UseEntity render={it => (
								<div className="relative border rounded shadow hover:shadow-md hover:border-yellow-500" onClick={() => {
									it && connect(it)
									closeOnSelect && setOpen(false)
								}}>
									<UploadedImageView {...imageFields} />
								</div>
							)} />
						</DataGridTiles>
						<DataGridTable>
							<DataGridColumn headerClassName="w-0">
								<UseEntity render={it => (<Button onClick={() => {
									it && connect(it)
									closeOnSelect && setOpen(false)
								}}>Select</Button>)} />
							</DataGridColumn>
							<DataGridTextColumn field="url" header="URL">
								<Field field="url" />
								<StaticRender>
									<ImageField {...imageFields} />
								</StaticRender>
							</DataGridTextColumn>
						</DataGridTable>
					</DataGridLoader>
					<DataGridPagination />
				</DataGrid>
			</DialogContent>
		</Dialog>
	)
}

export const image = () => <>

	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<ImageField
				baseField="image"
				{...imageFields}
				label="Image file"
				description="Some description of the image file."
				dropzonePlaceholder={(
					<UploaderDropzoneAreaUI className="w-60">
						<UploadIcon className={'w-12 h-12 text-gray-400'} />
						<div className={'font-semibold text-sm'}>{dict.uploader.dropFiles}</div>
						<div className={'text-xs'}>{dict.uploader.or}</div>
						<div className={'flex gap-2 items-center text-xs'}>
							<Button size={'sm'} variant={'outline'}>{dict.uploader.browseFiles}</Button>
							<div onClick={e => e.stopPropagation()}>
								<SelectImage />
							</div>
						</div>
					</UploaderDropzoneAreaUI>
				)}
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
				{...imageFields}
				label="Image file"
				description="Some description of the image file."
				dropzonePlaceholder={(
					<UploaderDropzoneAreaUI className="w-60">
						<UploadIcon className={'w-12 h-12 text-gray-400'} />
						<div className={'font-semibold text-sm'}>{dict.uploader.dropFiles}</div>
						<div className={'text-xs'}>{dict.uploader.or}</div>
						<div className={'flex gap-2 items-center text-xs'}>
							<Button size={'sm'} variant={'outline'}>{dict.uploader.browseFiles}</Button>
							<div onClick={e => e.stopPropagation()}>
								<SelectImageRepeater />
							</div>
						</div>
					</UploaderDropzoneAreaUI>
				)}
			/>
		</EntitySubTree>
	</Binding>
</>
