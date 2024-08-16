import { Children, ReactNode, useMemo } from 'react'

const MULTIPLE_SPACES_REG_EXP = / +/g

function normalize(text: string): string {
	return text.replace(MULTIPLE_SPACES_REG_EXP, ' ').trim()
}

/**
 * Walks through the children and returns a string representation of the text content.
 *
 * @param node - The children to walk through.
 * @returns String representation of the text content or undefined if there is no text content.
 *
 */
export function getChildrenAsLabel(node: ReactNode): string | undefined {
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node)
	} else if (node === null || node === undefined || typeof node === 'boolean') {
		return undefined
	} else if (Array.isArray(node)) {
		return normalize(node.map(getChildrenAsLabel).join(''))
	} else {
		let label: (string | number)[] = []

		Children.map(node, child => {
			if (child === null || child === undefined || typeof child === 'boolean') {
			} else if (typeof child === 'string') {
				label.push(child)
			} else if (typeof child === 'number') {
				label.push(child)
			} else if (Array.isArray(child)) {
				const childLabel = getChildrenAsLabel(child)

				if (childLabel) {
					label.push(childLabel)
				}
			} else {
				// ReactElement | JSXElementConstructor | ReactPortal
				if ('props' in child && 'children' in child.props) {
					const childLabel = getChildrenAsLabel(child.props.children)

					if (childLabel) {
						label.push(childLabel)
					}
				} else if ('children' in child) {
					// ReactPortal
					const childLabel = getChildrenAsLabel(child.children)

					if (childLabel) {
						label.push(childLabel)
					}
				} else if (import.meta.env.DEV) {
					console.warn('Unsupported child:', child)
				}
			}
		})

		return label.length > 0 ? label.join('') : undefined
	}
}

/**
 * Walks through the children and returns a string representation of the text content.
 *
 * @param node - The children to walk through.
 * @returns String representation of the text content or undefined if there is no text content.
 *
 */
export function useChildrenAsLabel(node: ReactNode): string | undefined {
	return useMemo(() => getChildrenAsLabel(node), [node])
}
