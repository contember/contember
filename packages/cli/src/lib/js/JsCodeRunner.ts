import { JsBuilder } from './JsBuilder.js'
import { JsExecutor } from './JsExecutor.js'

export class JsCodeRunner {
	constructor(
		private readonly jsBuilder: JsBuilder,
		private readonly jsExecutor: JsExecutor,
	) {
	}

	run = async (path: string): Promise<unknown> => {
		const builtCode = await this.jsBuilder.build(path)
		return this.jsExecutor.execute(builtCode)
	}
}
