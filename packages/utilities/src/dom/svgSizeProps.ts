export interface SvgSizeProps {
	width: number;
	height: number;
	viewBox: string;
}

export function svgSizeProps(
	width: number,
	height?: number,
	crop: number = 0,
): SvgSizeProps {
	const viewBoxWidth = width - crop * 2
	const viewBoxHeight = (height ?? width) - crop * 2
	const viewBoxX = crop
	const viewBoxY = crop
	return {
		width: viewBoxWidth,
		height: viewBoxHeight,
		viewBox: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
	}
}
