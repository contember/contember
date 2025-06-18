import { AudioFileDataExtractorProps } from '@contember/react-uploader';
import { ButtonHTMLAttributes } from 'react';
import { ClassAttributes } from 'react';
import { ComponentType } from 'react';
import { FileUrlDataExtractorProps } from '@contember/react-uploader';
import { ForwardRefExoticComponent } from 'react';
import { GenericFileMetadataExtractorProps } from '@contember/react-uploader';
import { HTMLAttributes } from 'react';
import { ImageFileDataExtractorProps } from '@contember/react-uploader';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { RefAttributes } from 'react';
import { SugaredRelativeSingleEntity } from '@contember/interface';
import { VideoFileDataExtractorProps } from '@contember/react-uploader';

export declare type BaseFileViewProps = {
    baseField?: SugaredRelativeSingleEntity['field'];
    actions?: ReactNode;
    edit?: ReactNode;
    noDestroy?: boolean;
    DestroyAction?: ComponentType<{
        children: ReactElement;
    }>;
};

export declare const UploadedAnyView: NamedExoticComponent<UploadedAnyViewProps>;

export declare type UploadedAnyViewProps = FileUrlDataExtractorProps & GenericFileMetadataExtractorProps & BaseFileViewProps;

export declare const UploadedAudioView: NamedExoticComponent<UploadedAudioViewProps>;

export declare type UploadedAudioViewProps = FileUrlDataExtractorProps & GenericFileMetadataExtractorProps & AudioFileDataExtractorProps & BaseFileViewProps;

export declare const UploadedImageView: NamedExoticComponent<UploadedImageViewProps>;

export declare type UploadedImageViewProps = FileUrlDataExtractorProps & GenericFileMetadataExtractorProps & ImageFileDataExtractorProps & BaseFileViewProps;

export declare const UploadedVideoView: NamedExoticComponent<UploadedVideoViewProps>;

export declare type UploadedVideoViewProps = FileUrlDataExtractorProps & GenericFileMetadataExtractorProps & VideoFileDataExtractorProps & BaseFileViewProps;

/**
 * Props {@link UploaderDropzoneProps}
 *
 * `UploaderDropzone` renders a file drop area UI for uploading files, with optional
 * placeholder customization and conditional display of a loader while uploads are in progress.
 *
 * Requires usage within an uploader context providing file upload state.
 *
 * - Displays a loader when uploads are active and `inactiveOnUpload` is `true`
 * - Supports custom placeholder content via `dropzonePlaceholder`
 *
 * #### Example: Basic usage with custom placeholder
 * ```tsx
 * <UploaderDropzone
 *   inactiveOnUpload
 *   dropzonePlaceholder={<div>Drop files here or click to upload</div>}
 * />
 * ```
 */
export declare const UploaderDropzone: ({ inactiveOnUpload, dropzonePlaceholder }: UploaderDropzoneProps) => JSX_2.Element;

export declare const UploaderDropzoneAreaUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
} & {
size?: "square" | null | undefined;
}, "ref"> & RefAttributes<HTMLDivElement>>;

/**
 * Props for {@link UploaderDropzone}
 */
export declare type UploaderDropzoneProps = {
    /**
     * Custom placeholder content for the dropzone area.
     */
    dropzonePlaceholder?: ReactNode;
    /**
     * Whether the dropzone should be inactive when uploads are in progress.
     */
    inactiveOnUpload?: boolean;
};

export declare const UploaderDropzoneWrapperUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const UploaderInactiveDropzoneUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const UploaderItemUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const UploaderRepeaterDragOverlayUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const UploaderRepeaterHandleUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLButtonElement> & ButtonHTMLAttributes<HTMLButtonElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLButtonElement>>;

export declare const UploaderRepeaterItemsWrapperUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const UploaderRepeaterItemUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export { }
