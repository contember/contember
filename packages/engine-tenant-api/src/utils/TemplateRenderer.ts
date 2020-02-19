import { render } from 'mustache'

export class TemplateRenderer {
	public async render(template: string, parameters: Record<string, any>): Promise<string> {
		return render(template, parameters)
	}
}
