import { Plugin, ProjectContainer } from '@contember/engine-plugins'
import { S3ConfigProcessor } from './S3ConfigProcessor'
import { S3SchemaContributor } from './S3SchemaContributor'
import { S3ServiceFactory } from './S3Service'
import { ProjectWithS3Config } from './Config'

export * from './S3SchemaContributor'
export * from './S3Service'

export default class S3 implements Plugin<ProjectWithS3Config> {
	name = 'contember/s3'

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
