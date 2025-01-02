import { EntitySubTree, StaticRender, useEntity } from '@contember/react-binding'
import { useState } from 'react'
import { Binding, PersistButton } from '~/lib/binding'
import { Slots } from '~/lib/layout'
import { AudioField, FileField, ImageField, ImageRepeaterField, VideoField } from '~/lib/form'
import { Dialog, DialogContent, DialogTrigger } from '~/lib/ui/dialog'
import { Button } from '~/lib/ui/button'
import { DataGrid, DataGridColumn, DataGridLoader, DataGridPagination, DataGridTable, DataGridTextColumn, DataGridTiles, DataGridToolbar } from '~/lib/datagrid'
import { UploadedImageView, UploaderDropzoneAreaUI } from '~/lib/upload'
import { UseEntity } from '~/app/components/UseEntity'
import { EntityAccessor, Field } from '@contember/interface'
import { FileUrlDataExtractorProps, GenericFileMetadataExtractorProps, ImageFileDataExtractorProps } from '@contember/react-uploader'
import { UploadIcon } from 'lucide-react'
import { dict } from '~/lib/dict'
import { Title } from '../components/title'

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

export const Image = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<UploadIcon />}>Image upload</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<ImageField
				baseField="image"
				{...imageFields}
				label="Image file"
				description="Some description of the image file."
				dropzonePlaceholder={(
					<UploaderDropzoneAreaUI className="w-60">
						<UploadIcon className="w-12 h-12 text-gray-400" />
						<div className="font-semibold text-sm">{dict.uploader.dropFiles}</div>
						<div className="text-xs">{dict.uploader.or}</div>
						<div className="flex gap-2 items-center text-xs">
							<Button size="sm" variant="outline">{dict.uploader.browseFiles}</Button>
							<div onClick={e => e.stopPropagation()}>
								<SelectImage />
							</div>
						</div>
					</UploaderDropzoneAreaUI>
				)}
			/>
		</EntitySubTree>
	</Binding>
)


export const ImageTrivial = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<UploadIcon />}>Image w/o meta upload</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="UploadRoot(unique = unique)" setOnCreate="(unique = unique)">
			<ImageField
				baseField="imageTrivial"
				urlField="url"
				label="Image file"
				description="Some description of the image file."
			/>
		</EntitySubTree>
	</Binding>
)

export const Audio = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<UploadIcon />}>Audio upload</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

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
)

export const Video = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<UploadIcon />}>Video upload</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

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
)

export const Any = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<UploadIcon />}>Generic file upload</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

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
)

export const ImageList = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<UploadIcon />}>Image repeater upload</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

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
						<UploadIcon className="w-12 h-12 text-gray-400" />
						<div className="font-semibold text-sm">{dict.uploader.dropFiles}</div>
						<div className="text-xs">{dict.uploader.or}</div>
						<div className="flex gap-2 items-center text-xs">
							<Button size="sm" variant="outline">{dict.uploader.browseFiles}</Button>
							<div onClick={e => e.stopPropagation()}>
								<SelectImageRepeater />
							</div>
						</div>
					</UploaderDropzoneAreaUI>
				)}
			/>
		</EntitySubTree>
	</Binding>
)
