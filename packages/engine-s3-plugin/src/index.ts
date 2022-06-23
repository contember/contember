import { Plugin, ProjectContainer } from '@contember/engine-plugins'
import { S3ConfigProcessor } from './S3ConfigProcessor.js'
import { S3SchemaContributor } from './S3SchemaContributor.js'
import { S3ServiceFactory } from './S3Service.js'
import { ProjectWithS3Config } from './Config.js'

export * from './S3SchemaContributor.js'
export * from './S3Service.js'

export default class S3 implements Plugin<ProjectWithS3Config> {
	getConfigProcessor() {
		return new S3ConfigProcessor()
	}

	getSchemaContributor(container: ProjectContainer<ProjectWithS3Config>) {
		const projectConfig = container.project
		if (!projectConfig.s3) {
			return undefined
		}
		const s3ServiceFactory = new S3ServiceFactory()
		return new S3SchemaContributor(projectConfig.s3, s3ServiceFactory, container.providers)
	}
}
