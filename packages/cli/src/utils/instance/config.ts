import { join } from 'path'
import { JsonUpdateCallback, readMultipleYaml, updateYaml } from '../yaml'

const INSTANCE_LOCAL_FILE = 'contember.instance.local.yaml'

export interface InstanceConfig {
	api?: {
		configFile?: string
	}
	admin?: {
		projectsFile?: string
	}
	loginToken?: string
	apiToken?: string
}

export const readInstanceConfig = async (args: { instanceDirectory: string }): Promise<InstanceConfig> => {
	const paths = ['contember.instance.yaml', INSTANCE_LOCAL_FILE].map(it => join(args.instanceDirectory, it))
	return await readMultipleYaml(paths)
}

export const updateInstanceLocalConfig = async (args: {
	instanceDirectory: string
	updater: JsonUpdateCallback<InstanceConfig>
}): Promise<void> => {
	const path = join(args.instanceDirectory, INSTANCE_LOCAL_FILE)
	return updateYaml<InstanceConfig>(path, args.updater, { createMissing: true })
}
