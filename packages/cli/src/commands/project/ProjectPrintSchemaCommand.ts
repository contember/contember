import { Command, CommandConfiguration, Input, Workspace, validateProjectName } from '@contember/cli-common'
import { validateSchemaAndPrintErrors } from '../../utils/schema'
import {
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	PermissionFactory,
	Authorizator,
} from '@contember/engine-content-api'
import { DocumentNode, printSchema } from 'graphql'
import { mergeSchemas } from '@graphql-tools/schema'
import { loadSchema } from '../../utils/project/loadSchema.js'

type Args = {
	project: string
}

type Options = {
	role?: string[]
	format?: 'graphql' | 'introspection' | 'schema'
}

export class ProjectPrintSchemaCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Prints project schema')
		configuration.argument('project')
		configuration.option('format').valueRequired().description('graphql|introspection|schema')
		configuration.option('role').valueArray()
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')
		const workspace = await Workspace.get(process.cwd())
		const format = input.getOption('format') || 'graphql'

		validateProjectName(projectName)
		const project = await workspace.projects.getProject(projectName, { fuzzy: true })
		const schema = await loadSchema(project)
		if (!validateSchemaAndPrintErrors(schema, 'Defined schema is invalid:')) {
			return 1
		}
		const permissionFactory = new PermissionFactory(schema.model)
		const inputRoles = input.getOption('role')
		const permissions = permissionFactory.create(schema.acl, inputRoles || ['admin'])
		const schemaBuilderFactory = new GraphQlSchemaBuilderFactory()
		const authorizator = new Authorizator(permissions, schema.acl.customPrimary ?? false)
		const introspection = new IntrospectionSchemaFactory(
			schema.model,
			new EntityRulesResolver(schema.validation, schema.model),
			authorizator,
		)
		if (format === 'schema') {
			if (inputRoles) {
				throw `--roles option is not supported for "schema" format`
			}
			console.log(JSON.stringify(schema, null, '\t'))
		} else if (format === 'introspection') {
			console.log(JSON.stringify(introspection.create(), null, '\t'))
		} else if (format === 'graphql') {
			const contentSchema = schemaBuilderFactory.create(schema.model, authorizator).build()
			const introspectionSchemaFactory = new IntrospectionSchemaDefinitionFactory(introspection)
			const introspectionSchema = introspectionSchemaFactory.create()
			const gqlSchema = mergeSchemas({
				schemas: [contentSchema],
				typeDefs: introspectionSchema.typeDefs as DocumentNode,
			})
			gqlSchema.description = '' // this enforces schema definition print
			const printedSchema = printSchema(gqlSchema).replace('""""""\n', '') // remove empty comment
			console.log(printedSchema)
		} else {
			throw `Unknown format ${format}`
		}

		return 0
	}
}
