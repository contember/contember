import type { PanelAssetMap } from '../PanelAssets.js'

/**
 * Overwritten by `scripts/buildAssets.ts` during `pre-build` with the built panel UI. The committed
 * version is empty on purpose: the real map is a multi-megabyte blob that has no business in git,
 * and an engine built without the panel simply refuses to enable it.
 */
export const panelAssets: PanelAssetMap = {}
