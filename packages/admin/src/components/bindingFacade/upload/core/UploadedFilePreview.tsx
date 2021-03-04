import { FilePreview } from '@contember/ui'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'

export interface UploadedFilePreviewProps {
	renderFile: undefined | (() => ReactNode)
}

export const UploadedFilePreview = memo(({ renderFile }: UploadedFilePreviewProps) => {
	return <FilePreview>{renderFile?.()}</FilePreview> // TODO render file default
})
UploadedFilePreview.displayName = 'UploadedFilePreview'
