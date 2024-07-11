import { JsExecutor } from './JsExecutor'

export class EvalExecutor implements JsExecutor {
	public async execute(code: string): Promise<unknown> {
		const fn = new Function(`var module = {}; ((module) => { ${code} })(module); return module`)
		return fn().exports
	}
}
