import { Plugin, SchemaContributorArgs } from '@contember/engine-plugins'
import { S3ConfigProcessor } from './S3ConfigProcessor'
import { S3SchemaContributor } from './S3SchemaContributor'
import { S3ServiceFactory } from './S3Service'
import { Project3Config } from './Config'

export * from './S3SchemaContributor'
export * from './S3Service'

export default class S3 implements Plugin<Project3Config> {
	name = 'contember/s3'

	getConfigProcessor() {
		return new S3ConfigProcessor()
	}

	getSchemaContributor({ project, providers }: SchemaContributorArgs<Project3Config>) {
		if (!project.s3) {
			return undefined
		}
		const s3ServiceFactory = new S3ServiceFactory()
		return new S3SchemaContributor(project.s3, s3ServiceFactory, providers)
	}
}
