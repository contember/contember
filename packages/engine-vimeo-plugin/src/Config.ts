import { ProjectConfig } from '@contember/engine-plugins'
import { Typesafe } from '@contember/engine-common'

export const vimeoConfigSchema = Typesafe.object({
	token: Typesafe.string,
})

export type VimeoConfig = ReturnType<typeof vimeoConfigSchema>

export type ProjectWithVimeoConfig = ProjectConfig<{ vimeo?: VimeoConfig | undefined }>
