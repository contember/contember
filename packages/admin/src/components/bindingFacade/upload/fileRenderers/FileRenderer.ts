import { EntityAccessor, Environment } from '@contember/binding'
import * as React from 'react'

export interface FileRenderer {
	canPreviewFile?: (file: File, previewUrl: string) => boolean
	renderFilePreview?: (file: File, previewUrl: string) => React.ReactNode

	canRenderFile: (entityAccessor: EntityAccessor, environment: Environment) => boolean
	renderFile: (entityAccessor: EntityAccessor, environment: Environment) => React.ReactNode
}
