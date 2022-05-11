export const toFeatureClass = (
  name: string,
  feature?: boolean,
) => feature
  ? `with-${name}`
  : undefined
