export const toViewClass = (name: string | undefined) => (name && name !== 'default' ? `view-${name}` : undefined)
