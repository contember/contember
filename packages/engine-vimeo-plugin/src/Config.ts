import { ProjectConfig } from '@contember/engine-plugins'

export interface VimeoConfig {
	readonly token: string
}

export type ProjectWithVimeoConfig = ProjectConfig<{ vimeo?: VimeoConfig | undefined }>
