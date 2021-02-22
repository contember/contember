import { Command, CommandConfiguration, Input } from '../../cli'
import { validateProjectName } from '../../utils/Project'
import { Schema } from '@contember/schema'
import { validateSchemaAndPrintErrors } from '../../utils/schema'
import { Workspace } from '../../utils/Workspace'
import {
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	PermissionFactory,
	StaticAuthorizator,
} from '@contember/engine-content-api'
import { DocumentNode, printSchema } from 'graphql'
import { mergeSchemas } from 'graphql-tools'

type Args = {
	project: string
}

type Options = {
	role?: string[]
	format?: 'graphql' | 'introspection'
}

export class ProjectPrintSchemaCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Prints project schema')
		configuration.argument('project')
		configuration.option('format').valueRequired().description('graphql|introspection')
		configuration.option('role').valueArray()
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')
		const workspace = await Workspace.get(process.cwd())
		const format = input.getOption('format') || 'graphql'

		validateProjectName(projectName)
		const project = await workspace.projects.getProject(projectName, { fuzzy: true })
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const schema: Schema = require(project.apiDir).default
		if (!validateSchemaAndPrintErrors(schema, 'Defined schema is invalid:')) {
			return 1
		}
		const permissionFactory = new PermissionFactory(schema.model)
		const permissions = permissionFactory.create(schema.acl, input.getOption('role') || ['admin'])
		const schemaBuilderFactory = new GraphQlSchemaBuilderFactory()
		const authorizator = new StaticAuthorizator(permissions)
		const introspection = new IntrospectionSchemaFactory(
			schema.model,
			new EntityRulesResolver(schema.validation, schema.model),
			authorizator,
		)
		if (format === 'introspection') {
			console.log(JSON.stringify(introspection.create(), null, '\t'))
		} else if (format === 'graphql') {
			const contentSchema = schemaBuilderFactory.create(schema.model, authorizator).build()
			const introspectionSchemaFactory = new IntrospectionSchemaDefinitionFactory(introspection)
			const introspectionSchema = introspectionSchemaFactory.create()
			const gqlSchema = mergeSchemas({
				schemas: [contentSchema],
				typeDefs: introspectionSchema.typeDefs as DocumentNode,
			})
			console.log(printSchema(gqlSchema))
		} else {
			throw new Error(`Unknown format ${format}`)
		}

		return 0
	}
}
