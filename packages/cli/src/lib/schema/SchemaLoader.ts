import { join } from 'node:path'
import { Schema } from '@contember/schema'
import { schemaType } from '@contember/schema-utils'
import { JsCodeRunner } from '../js/JsCodeRunner'
import * as Typesafe from '@contember/typesafe'
import { Workspace } from '../workspace/Workspace'

export class ImportSchemaLoader {
	constructor(
		private readonly workspace: Promise<Workspace>,
	) {
	}

	loadSchema = async (): Promise<Schema> => {
		const path = join((await this.workspace).apiDir, 'index.ts')
		const result = await import(path)
		return Typesafe.object({ default: schemaType })(result).default
	}
}

export class TranspilingSchemaLoader {
	constructor(
		private readonly workspace: Promise<Workspace>,
		private readonly jsCodeRunner: JsCodeRunner,
	) {
	}

	loadSchema = async (): Promise<Schema> => {
		const path = join((await this.workspace).apiDir, 'index.ts')

		const result = (await this.jsCodeRunner.run(path))
		return Typesafe.object({ default: schemaType })(result).default
	}
}

export interface SchemaLoader {
	loadSchema(): Promise<Schema>
}
