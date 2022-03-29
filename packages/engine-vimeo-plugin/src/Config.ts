import { ProjectConfig } from '@contember/engine-plugins'
import * as Typesafe from '@contember/typesafe'

export const vimeoConfigSchema = Typesafe.object({
	token: Typesafe.string,
})

export type VimeoConfig = ReturnType<typeof vimeoConfigSchema>

export type ProjectWithVimeoConfig = ProjectConfig<{ vimeo?: VimeoConfig | undefined }>
