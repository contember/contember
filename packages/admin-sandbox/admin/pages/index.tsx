import {
	Block,
	Component,
	DataGrid,
	DiscriminatedBlocks,
	EditScope,
	EntityAccessor,
	EntityId,
	Field,
	FileRepeater,
	FileSelectionProps,
	GenericCell,
	HasOne,
	ImageFileRepeater,
	ImageFiles,
	ImageUploadField,
	Link,
	PersistButton,
	S3FileUploader,
	StaticRender,
	SugaredQualifiedEntityList,
	TextCell,
	TextField,
	UploadField,
	VideoFiles,
} from '@contember/admin'
import { DataGridTile } from '../components/DataGridTile'
import { Actions, ContentStack, Title } from '../components/Layout'

const GalleryItemTile = Component(({ onClick, selectedEntityIds }: {
	onClick?: (entity: EntityAccessor) => void
	selectedEntityIds?: EntityId[]
}) => {
	return <DiscriminatedBlocks field={'type'} label={undefined} allowBlockTypeChange={false}>
		<Block discriminateBy={'image'}>
			<DataGridTile
				selectedEntityIds={selectedEntityIds}
				thumbnailField="image.url"
				onClick={onClick}
			>
			</DataGridTile>
		</Block>
		<Block discriminateBy={'basicImage'}>
			<DataGridTile
				selectedEntityIds={selectedEntityIds}
				thumbnailField="basicImage.url"
				onClick={onClick}
			>
			</DataGridTile>
		</Block>
		<Block discriminateBy={'video'}>
			<DataGridTile
				selectedEntityIds={selectedEntityIds}
				onClick={onClick}
			>
			</DataGridTile>
		</Block>
	</DiscriminatedBlocks>
})
const GallerySelectForm = Component((
	{
		onToggleSelect,
		selectedEntityIds,
	}: FileSelectionProps & {}) => (
	<DataGrid
		itemsPerPage={12}
		entities={'GalleryItem'}
		tile={<GalleryItemTile
			selectedEntityIds={selectedEntityIds}
			onClick={onToggleSelect}
		/>}
		tileSize={260}
		selectedEntityIds={selectedEntityIds}
		onEntityClick={onToggleSelect}
	>
		<TextCell field="type" header="Type" />
		<GenericCell>
			<StaticRender>
				<HasOne field={'image'}>
					<Field field={'url'} />
					<Field field={'size'} />
					<Field field={'type'} />
					<Field field={'width'} />
					<Field field={'height'} />

					<Field field={'type'} />
					<Field field={'fileName'} />
					<Field field={'alt'} />
				</HasOne>
				<HasOne field={'basicImage'}>
					<Field field={'url'} />
					<Field field={'size'} />
					<Field field={'type'} />
					<Field field={'width'} />
					<Field field={'height'} />
				</HasOne>
				<HasOne field={'video'}>
					<Field field={'url'} />
					<Field field={'size'} />
					<Field field={'type'} />
					<Field field={'width'} />
					<Field field={'height'} />
				</HasOne>
			</StaticRender>
		</GenericCell>
	</DataGrid>
))

const ImageSelectForm = Component((
	{
		entities,
		onToggleSelect,
		selectedEntityIds,
		isComplex,
	}: FileSelectionProps & {
		entities: SugaredQualifiedEntityList['entities']
		isComplex: boolean
	}) => (
	<DataGrid
		itemsPerPage={12}
		entities={entities}
		tile={<DataGridTile
			selectedEntityIds={selectedEntityIds}
			thumbnailField="url"
			onClick={onToggleSelect}
		/>}
		tileSize={260}
		selectedEntityIds={selectedEntityIds}
		onEntityClick={onToggleSelect}
	>
		<TextCell field="url" header="URL" />
		<GenericCell>
			<StaticRender>
				<Field field={'size'} />
				<Field field={'type'} />
				<Field field={'width'} />
				<Field field={'height'} />
				{isComplex && <>
					<Field field={'type'} />
					<Field field={'fileName'} />
					<Field field={'alt'} />

				</>}
			</StaticRender>
		</GenericCell>
	</DataGrid>
))

const s3FileUploader = new S3FileUploader({
	getUploadOptions: file => ({
		fileSuffix: 'foobar',
		fileName: file.name,
		fileSize: file.size,
	}),
})

export default () => (
	<EditScope entity="UploadShowcase(unique = One)" setOnCreate="(unique = One)">
		<Title>Welcome to Contember!</Title>

		<Actions><PersistButton /></Actions>

		<ContentStack>
			<Link to="second">GO TO SECOND &rarr;</Link>
			<ImageUploadField urlField="singleTrivialImage.url" label="Trivial image" />

			<ImageFileRepeater
				label="Many basic image"
				field="multipleBasicImageList"
				baseEntity={'image'}
				urlField="url"
				sortableBy="order"
				fileSelectionComponent={ImageSelectForm}
				fileSelectionProps={{
					entities: 'BasicImage',
					isComplex: false,
				}}
				uploader={s3FileUploader}
			/>

			<ImageUploadField
				label="Single basic image"
				baseEntity="singleBasicImage"

				// Feature: immediatePersist
				// Select one > confirm
				// Hide already attached entities (entityListAccessor)

				fileSelectionComponent={ImageSelectForm}
				fileSelectionProps={{
					entities: 'BasicImage',
					isComplex: false,
				}}

				urlField="url"
				widthField="width"
				heightField="height"
				fileSizeField="size"
				fileTypeField="type"
			/>
			<UploadField label="Discriminated has one" baseEntity="discriminatedAttachment" discriminationField="type">
				<ImageFiles
					discriminateBy="image"
					baseEntity="image"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
					fileNameField="fileName"
					fileSelectionComponent={ImageSelectForm}
					fileSelectionProps={{
						entities: 'ComplexImage',
						isComplex: true,
					}}
					fileSelectionLabel={'Complex image'}
				>
					<TextField field="alt" label="Image alternate" />
				</ImageFiles>
				<ImageFiles
					discriminateBy="basicImage"
					baseEntity="basicImage"
					urlField="url"
					fileSelectionComponent={ImageSelectForm}
					fileSelectionProps={{
						entities: 'BasicImage',
						isComplex: false,
					}}
					fileSelectionLabel={'Basic image'}
				>
				</ImageFiles>
				<VideoFiles
					discriminateBy="video"
					baseEntity="video"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
				>
					test test
				</VideoFiles>
			</UploadField>
			<FileRepeater field="fileList.items" boxLabel="Complex file list" label="Complex file list item" sortableBy="order" discriminationField="type">
				<ImageFiles
					discriminateBy="image"
					baseEntity="image"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
					fileNameField="fileName"
					fileSelectionComponent={ImageSelectForm}
					fileSelectionProps={{
						entities: 'ComplexImage',
						isComplex: true,
					}}
					fileSelectionLabel={'Complex image'}
				>
					<TextField field="alt" label="Image alternate" />
				</ImageFiles>
				<ImageFiles
					discriminateBy="basicImage"
					baseEntity="basicImage"
					urlField="url"
					fileSelectionComponent={ImageSelectForm}
					fileSelectionProps={{
						entities: 'BasicImage',
						isComplex: false,
					}}
					fileSelectionLabel={'Basic image'}
				>
				</ImageFiles>
				<VideoFiles
					discriminateBy="video"
					baseEntity="video"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
				>
					test test
				</VideoFiles>
			</FileRepeater>

			<UploadField
				label="Gallery item"
				baseEntity="galleryItem"
				discriminationField="type"
				fileSelectionComponent={GallerySelectForm}
			>
				<ImageFiles
					discriminateBy="basicImage"
					baseEntity="basicImage"
					urlField="url"
				>
				</ImageFiles>
				<ImageFiles
					discriminateBy="image"
					baseEntity="image"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
					fileNameField="fileName"
				>
					<TextField field="alt" label="Image alternate" />
				</ImageFiles>
				<VideoFiles
					discriminateBy="video"
					baseEntity="video"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
				>
				</VideoFiles>
			</UploadField>

			<FileRepeater
				field="galleryList.items"
				baseEntity={'item'}
				boxLabel="Gallery list"
				label="Gallery list"
				sortableBy="order"
				fileSelectionComponent={GallerySelectForm}
				discriminationField="type"
			>
				<ImageFiles
					discriminateBy="basicImage"
					baseEntity="basicImage"
					urlField="url"
				>
				</ImageFiles>
				<ImageFiles
					discriminateBy="image"
					baseEntity="image"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
					fileNameField="fileName"
				>
					<TextField field="alt" label="Image alternate" />
				</ImageFiles>
				<VideoFiles
					discriminateBy="video"
					baseEntity="video"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
				>
				</VideoFiles>
			</FileRepeater>
		</ContentStack>
	</EditScope>
)
