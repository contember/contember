/**
 * formatImageResizeUrl - Generates optimized image URLs
 *
 * #### Purpose
 * Creates URLs for on-demand image processing
 *
 * #### Features
 * - Only processes Contember-hosted images
 * - Maintains original URL for external images
 * - Defaults to contain fit and auto format
 * - URL-encoded transformation parameters
 *
 * #### Example
 * ```ts
 * formatImageResizeUrl('https://cdn.cntmbr.com/image.jpg', { width: 300 })
 * // 'https://cdn.cntmbr.com/cdn-cgi/image/width=300,fit=contain,f=auto/image.jpg'
 * ```
 */
export declare const formatImageResizeUrl: (src: string, options?: ImageResizeOptions) => string;

export declare interface ImageResizeOptions {
    /** Target width in pixels */
    width?: number;
    /** Target height in pixels */
    height?: number;
    /** Gaussian blur radius (0-100) */
    blur?: number;
    /** Output quality (1-100) */
    quality?: number;
    /** Resize behavior */
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
    /** Output format */
    format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'baseline-jpeg' | 'json';
}

export { }
