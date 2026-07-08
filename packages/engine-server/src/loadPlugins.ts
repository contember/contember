import ActionsPlugin from '@contember/engine-actions'
import { Plugin } from '@contember/engine-plugins'
import RetentionPlugin from '@contember/engine-retention'
import S3Plugin from '@contember/engine-s3-plugin'
import SchedulerPlugin from '@contember/engine-scheduler'
import VimeoPlugin from '@contember/engine-vimeo-plugin'

export default function loadPlugins(): Promise<Plugin[]> {
	// Scheduler first: retention registers its job on the scheduler's shared registry.
	const scheduler = new SchedulerPlugin()
	return Promise.resolve([
		new S3Plugin(),
		new VimeoPlugin(),
		new ActionsPlugin(),
		scheduler,
		new RetentionPlugin(scheduler.registry),
	])
}
