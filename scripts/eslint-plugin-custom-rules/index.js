const path = require('path')
const fs = require('fs')

const tryLStat = path => {
	try {
		return fs.lstatSync(path)
	} catch {
		return null
	}
}

module.exports = {
	rules: {
		'es-import': {
			meta: {
				type: 'problem',
				fixable: 'code',
			},
			create: function (context) {
				const dirname = path.dirname(context.getFilename())
				const validateNode = (node, type) => {
					if (!node.source.value.startsWith('.') || node.source.value.endsWith('.js')) {
						return
					}
					const filePath = path.resolve(dirname, node.source.value)
					const dirStat = tryLStat(filePath)
					const fileStat = tryLStat(filePath + '.ts')
					if (dirStat && fileStat) {
						context.report({
							node,
							message: `${type} ${node.source.value} is ambiguous`,
						})
						return
					}
					if (!dirStat && !fileStat) {
						context.report({
							node,
							message: `unresolved ${type} ${node.source.value}`,
						})
						return
					}
					if (dirStat && dirStat.isDirectory()) {
						context.report({
							node,
							message: `missing /index.js in ${node.source.value} directory ${type}`,
							fix: function (fixer) {
								return fixer.insertTextAfterRange([node.source.range[0], node.source.range[1] - 1], '/index.js')
							},
						})
						return
					}
					if (fileStat) {
						context.report({
							node,
							message: `missing .js extension in ${node.source.value} file ${type}`,
							data: {},
							fix: function (fixer) {
								return fixer.insertTextAfterRange([node.source.range[0], node.source.range[1] - 1], '.js')
							},
						})
					}
				}
				return {
					ExportAllDeclaration(node) {
						validateNode(node, 'export')
					},
					ExportNamedDeclaration(node) {
						if (!node.source) {
							return
						}
						validateNode(node, 'export')
					},
					ImportDeclaration(node) {
						validateNode(node, 'import')
					},
				}
			},
		},
	},
}
