import type { Environment } from '@contember/binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import type { FileKindProps } from '../FileKind'
import { FileKind } from '../FileKind'
import type { DiscriminatedFileKind } from '../interfaces'

export class BoxedFileKind {
	public constructor(public readonly value: DiscriminatedFileKind) {}
}

const fileKindLeaf = new Leaf<FileKindProps>(node => {
	const {
		acceptFile,
		acceptMimeTypes,
		baseEntity,
		children,
		discriminateBy,
		extractors,
		renderFilePreview,
		renderUploadedFile,
		uploader,
		...rest
	} = node.props
	return new BoxedFileKind({
		acceptFile,
		acceptMimeTypes,
		baseEntity,
		children,
		discriminateBy,
		extractors,
		renderFilePreview,
		renderUploadedFile,
		uploader,
		...rest,
	})
}, FileKind)

export const fileKindTemplateAnalyzer = new ChildrenAnalyzer<BoxedFileKind, never, Environment>([fileKindLeaf], {
	ignoreUnhandledNodes: false,
	staticRenderFactoryName: 'staticRender',
	unhandledNodeErrorMessage: 'Upload: only FileKind children are supported.',
})
