import { Schema } from '@contember/schema'
import { DefaultNamingConventions, NamingConventions } from '../model/index.js'
import { DefinitionCodeGenerator } from './DefinitionCodeGenerator.js'

/**
 * @deprecated use {@link DefinitionCodeGenerator}
 */
export class TsDefinitionGenerator {
	constructor(
		private readonly schema: Schema,
		private readonly conventions: NamingConventions = new DefaultNamingConventions(),
	) {
	}

	public generate() {
		const generator = new DefinitionCodeGenerator(this.conventions)
		return generator.generate(this.schema)
	}
}
