import ActionsPlugin from '@contember/engine-actions'
import { Plugin } from '@contember/engine-plugins'
import S3Plugin from '@contember/engine-s3-plugin'
import VimeoPlugin from '@contember/engine-vimeo-plugin'

export default function loadPlugins(): Promise<Plugin[]> {
	return Promise.resolve([new S3Plugin(), new VimeoPlugin(), new ActionsPlugin()])
}
