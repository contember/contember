import { JsExecutor } from './JsExecutor'

export class EvalExecutor implements JsExecutor {
	public async execute(code: string): Promise<unknown> {
		const fn = new Function('require', `var module = {}; ((module) => { ${code} })(module); return module`)
		return fn(require).exports
	}
}
