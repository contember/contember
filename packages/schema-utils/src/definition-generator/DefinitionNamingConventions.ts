export class DefinitionNamingConventions {
	private static reservedWords = new Set(['do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'null', 'this', 'true', 'void', 'with', 'await', 'break', 'catch', 'class', 'const', 'false', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof'])

	public formatIdentifier(id: string): string {
		// todo: validate
		return id
	}

	public roleVarName(id: string): string {
		return this.formatIdentifier(`${id}Role`)
	}

	public variableVarName(role: string, id: string): string {
		return this.formatIdentifier(`${id}${role.charAt(0).toUpperCase() + role.slice(1)}Variable`)
	}
}
