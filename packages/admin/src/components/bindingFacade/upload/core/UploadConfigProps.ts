import { EntityAccessor, Environment } from '@contember/binding'
import { FileUploader } from '@contember/client'

export interface UploadConfigProps {
	accept?: string | string[]
	uploader?: FileUploader
	hasPersistedFile?: (entity: EntityAccessor, environment: Environment) => boolean
}
