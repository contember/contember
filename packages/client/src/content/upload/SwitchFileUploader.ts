import { FileUploader, FileUploaderInitializeOptions } from './FileUploader'
import { UploadedFileMetadata } from './UploadedFileMetadata'

class SwitchFileUploader implements FileUploader {
	public constructor(private readonly subUploaders: SwitchFileUploader.SubUploaders) {}

	public async upload(files: Map<File, UploadedFileMetadata>, options: FileUploaderInitializeOptions) {
		const fileKinds: Map<FileUploader, Map<File, UploadedFileMetadata>> = new Map()
		const unhandledFiles: Array<[File, any]> = []

		fileLoop: for (const [file, metadata] of files) {
			for (const [predicate, uploader] of this.subUploaders) {
				if (predicate(file)) {
					let nestedMap = fileKinds.get(uploader)
					if (nestedMap === undefined) {
						fileKinds.set(uploader, (nestedMap = new Map()))
					}
					nestedMap.set(file, metadata)
					continue fileLoop
				}
			}
			unhandledFiles.push([file, undefined])
		}

		if (unhandledFiles.length && options.onError) {
			options.onError(unhandledFiles)
		}

		for (const [uploader, files] of fileKinds) {
			uploader.upload(files, options) // Deliberately no await
		}
	}
}

namespace SwitchFileUploader {
	export type FilePredicate = (file: File) => boolean
	export type SubUploaders = Iterable<[FilePredicate, FileUploader]>
}

export { SwitchFileUploader }
