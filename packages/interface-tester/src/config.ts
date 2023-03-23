import { ReactNode } from 'react'

import { Schema } from '@contember/schema'
import { Environment } from '@contember/admin'

export type Config =
	& PageConfig
	& {
		pagesDir?: string
		schema: Schema
		include?: string
		exclude?: string | string[]
		pages?: Record<string, PageConfig>
	}

export type PageConfig = {
	roles?: string[]
	parameters?: Environment.Parameters
	dimensions?: Environment.SelectedDimensions
	createNode?: (exported: unknown) => ReactNode
	testNode?: (node: ReactNode | undefined, environment: Environment, originalExport: unknown) => void
}
