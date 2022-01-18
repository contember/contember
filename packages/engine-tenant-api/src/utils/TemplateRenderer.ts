import mustache from 'mustache'

export class TemplateRenderer {
	public async render(template: string, parameters: Record<string, any>): Promise<string> {
		return mustache.render(template, parameters)
	}
}
