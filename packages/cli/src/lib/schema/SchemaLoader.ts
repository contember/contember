import { join } from 'node:path'
import { Schema } from '@contember/schema'
import { schemaType } from '@contember/schema-utils'
import { JsCodeRunner } from '../js/JsCodeRunner'
import * as Typesafe from '@contember/typesafe'
import { Workspace } from '../workspace/Workspace'

export class SchemaLoader {
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
