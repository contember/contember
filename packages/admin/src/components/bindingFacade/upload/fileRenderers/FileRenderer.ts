import { EntityAccessor } from '@contember/binding'
import * as React from 'react'

export interface FileRenderer {
	canPreviewFile?: (file: File, previewUrl: string) => boolean
	renderFilePreview?: (file: File, previewUrl: string) => React.ReactNode

	canRenderFile: (entityAccessor: EntityAccessor) => boolean
	renderFile: (entityAccessor: EntityAccessor) => React.ReactNode
}
