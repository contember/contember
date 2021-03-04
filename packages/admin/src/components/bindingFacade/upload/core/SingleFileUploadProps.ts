import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'

export interface SingleFileUploadProps {
	renderFile?: () => ReactNode
	renderFilePreview?: (file: File, previewUrl: string) => ReactNode
}
