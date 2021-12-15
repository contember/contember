import {
	EditPage,
	FileRepeater,
	ImageFiles,
	ImageUploadField,
	PageLink,
	TextField,
	UploadField,
	VideoFiles,
} from '@contember/admin'

// export const DashboardPage = (
// 	<GenericPage pageName="dashboard" title="Sandbox admin">
// 	</GenericPage>
// )

export const DashboardPage = (
	<EditPage pageName="dashboard" entity="UploadShowcase(unique = One)">
		<PageLink to="second">SECOND</PageLink>
		<ImageUploadField urlField="singleTrivialImage.url" label="Trivial imageddd" />
		<ImageUploadField
			label="Single basic image"
			baseEntity="singleBasicImage"
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
				test test
			</VideoFiles>
		</FileRepeater>
	</EditPage>
)
