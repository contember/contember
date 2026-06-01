import { Plugin, SchemaContributorArgs } from '@contember/engine-plugins'
import { S3ConfigProcessor } from './S3ConfigProcessor.js'
import { S3SchemaContributor } from './S3SchemaContributor.js'
import { S3ServiceFactory } from './S3Service.js'
import { Project3Config } from './Config.js'

export * from './S3ObjectAuthorizator.js'
export * from './S3SchemaContributor.js'
export * from './S3Service.js'

export default class S3 implements Plugin<Project3Config> {
	name = 'contember/s3'

	getConfigProcessor() {
		return new S3ConfigProcessor()
	}

	getSchemaContributor({ providers }: SchemaContributorArgs) {
		const s3ServiceFactory = new S3ServiceFactory()
		return new S3SchemaContributor(s3ServiceFactory, providers)
	}
}
