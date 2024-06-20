import { EntityAccessor, ErrorAccessorHolder } from '@contember/binding'
import { Environment } from '@contember/react-binding'
import { FileUploadResult, UploadClient, UploadClientUploadArgs } from './uploadClient'


export interface FileUploadHandler<FileOptions = {}, Result extends FileUploadResult = FileUploadResult> {
	staticRender: (args: FileUploadHandlerStaticRenderArgs) => React.ReactNode
	populateEntity: (args: FileUploadHandlerPopulateEntityArgs) => void
	getErrorsHolders: (args: FileUploadHandlerGetErrorHoldersArgs) => ErrorAccessorHolder[]
}

export interface FileUploadHandlerStaticRenderArgs {
	environment: Environment
}

export interface FileUploadHandlerPopulateEntityArgs<Result extends FileUploadResult = FileUploadResult> {
	entity: EntityAccessor
	uploadResult: Result
}

export interface FileUploadHandlerGetErrorHoldersArgs {
	entity: EntityAccessor
	environment: Environment
}
