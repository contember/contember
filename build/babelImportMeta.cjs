// This is almost entirely based on https://github.com/javiertury/babel-plugin-transform-import-meta
module.exports = function () {
	return {
		name: 'transform-import-meta',

		visitor: {
			Program(path) {
				const metas = []

				path.traverse({
					MemberExpression(memberExpPath) {
						const { node } = memberExpPath

						// if (
						// 	node.property.type === 'Identifier' &&
						// 	node.property.name === 'DEV' &&
						// 	node.object.type === 'MemberExpression' &&
						// 	node.object.property.type === 'Identifier' &&
						// 	node.object.property.name === 'env' &&
						// 	node.object.object.type === 'MetaProperty' &&
						// 	node.object.object.meta.name === 'import'
						// ) {
						// 	metas.push(memberExpPath)
						// }
						if (
							node.object.type === 'MetaProperty' &&
							node.object.meta.name === 'import' &&
							node.object.property.name === 'meta' &&
							node.property.type === 'Identifier' &&
							node.property.name === 'env'
						) {
							metas.push(memberExpPath);
						}
					},
				})

				if (metas.length === 0) {
					return
				}

				for (const meta of metas) {
					meta.replaceWithSourceString(`{ DEV: true, PROD: false }`)
				}
			},
		},
	}
}
