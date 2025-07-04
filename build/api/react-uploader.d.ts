import { ComponentType } from 'react';
import { Context } from 'react';
import { EntityAccessor } from '@contember/react-binding';
import type { Environment } from '@contember/react-binding';
import { ErrorAccessor } from '@contember/react-binding';
import type { ErrorAccessorHolder } from '@contember/react-binding';
import { GenerateUploadUrlMutationBuilder } from '@contember/client';
import { GraphQlClient } from '@contember/graphql-client';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { JSXElementConstructor } from 'react';
import { NamedExoticComponent } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { SugaredRelativeSingleEntity } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

export declare type AfterUploadEvent = {
    file: FileWithMeta;
    result: FileUploadResult;
    fileType: FileType;
};

export declare type AnyFileTypeProps = FileType & FileUrlDataExtractorProps & GenericFileMetadataExtractorProps;

export declare interface AudioFileDataExtractorProps {
    durationField?: SugaredRelativeSingleField['field'];
}

export declare type AudioFileTypeProps = FileType & FileUrlDataExtractorProps & GenericFileMetadataExtractorProps & AudioFileDataExtractorProps;

export declare type BeforeUploadEvent = {
    file: FileWithMeta;
    reject: (reason: string) => never;
};

export declare const createAnyFileType: ({ fileSizeField, fileTypeField, lastModifiedField, fileNameField, urlField, uploader, extractors, acceptFile, accept, }: AnyFileTypeProps) => FileType;

export declare const createAudioFileType: ({ durationField, fileSizeField, fileTypeField, lastModifiedField, fileNameField, urlField, uploader, extractors, acceptFile, accept, }: AudioFileTypeProps) => FileType;

export declare const createContentApiS3Signer: (client: GraphQlClient) => (parameters: GenerateUploadUrlMutationBuilder.FileParameters) => Promise<GenerateUploadUrlMutationBuilder.ResponseBody>;

export declare const createImageFileType: ({ uploader, urlField, fileSizeField, fileTypeField, lastModifiedField, fileNameField, heightField, widthField, accept, acceptFile, extractors, }: ImageFileTypeProps) => FileType;

export declare const createVideoFileType: ({ urlField, durationField, fileSizeField, fileTypeField, lastModifiedField, fileNameField, heightField, widthField, extractors, acceptFile, accept, uploader, }: VideoFileTypeProps) => FileType;

export declare type DiscriminatedFileType = FileType & {
    baseField?: SugaredRelativeSingleEntity['field'];
};

export declare type DiscriminatedFileTypeMap = Record<string, DiscriminatedFileType>;

export declare const DiscriminatedUploader: NamedExoticComponent<DiscriminatedUploaderProps>;

export declare type DiscriminatedUploaderProps = {
    baseField?: SugaredRelativeSingleEntity['field'];
    discriminatorField: SugaredRelativeSingleField['field'];
    children: ReactNode;
    types: DiscriminatedFileTypeMap;
};

declare type ErrorEvent_2 = {
    file: FileWithMeta;
    error: unknown;
    fileType?: FileType;
};
export { ErrorEvent_2 as ErrorEvent }

export declare interface FileDataExtractor {
    staticRender: (options: FileDataExtractorStaticRenderOptions) => ReactNode;
    extractFileData?: (options: FileWithMeta) => Promise<FileDataExtractorPopulator | undefined> | FileDataExtractorPopulator | undefined;
    populateFields?: (options: {
        entity: EntityAccessor;
        result: FileUploadResult;
    }) => void;
    getErrorsHolders?: (options: FileDataExtractorGetErrorsOptions) => ErrorAccessorHolder[];
}

export declare interface FileDataExtractorGetErrorsOptions {
    entity: EntityAccessor;
    environment: Environment;
}

export declare type FileDataExtractorPopulator = (options: {
    entity: EntityAccessor;
    result: FileUploadResult;
}) => void;

export declare interface FileDataExtractorStaticRenderOptions {
    environment: Environment;
}

export declare interface FileType {
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker#accept
     * null means "any mime type"
     */
    accept?: Record<string, string[]> | undefined;
    /** Optionally reject with {@link RejectFileError}. */
    acceptFile?: ((file: FileWithMeta) => boolean | Promise<void>) | undefined;
    extractors?: FileDataExtractor[];
    uploader?: UploadClient<any>;
}

export declare interface FileUploadProgress {
    progress: number;
    uploadedBytes: number;
    totalBytes: number;
}

export declare interface FileUploadResult {
    publicUrl: string;
}

export declare interface FileUrlDataExtractorProps {
    urlField: SugaredRelativeSingleField['field'];
}

export declare type FileWithMeta = {
    id: string;
    file: File;
    previewUrl: string;
    abortController: AbortController;
};

export declare interface GenericFileMetadataExtractorProps {
    fileNameField?: SugaredRelativeSingleField['field'];
    lastModifiedField?: SugaredRelativeSingleField['field'];
    fileSizeField?: SugaredRelativeSingleField['field'];
    fileTypeField?: SugaredRelativeSingleField['field'];
}

export declare const getAudioFileDataExtractor: (props: AudioFileDataExtractorProps) => FileDataExtractor;

export declare const getFileUrlDataExtractor: (props: FileUrlDataExtractorProps) => FileDataExtractor;

export declare const getGenericFileMetadataExtractor: (props: GenericFileMetadataExtractorProps) => FileDataExtractor;

export declare const getImageFileDataExtractor: (props: ImageFileDataExtractorProps) => FileDataExtractor;

export declare const getVideoFileDataExtractor: (props: VideoFileDataExtractorProps) => FileDataExtractor;

export declare interface ImageFileDataExtractorProps {
    widthField?: SugaredRelativeSingleField['field'];
    heightField?: SugaredRelativeSingleField['field'];
}

export declare type ImageFileTypeProps = FileType & FileUrlDataExtractorProps & GenericFileMetadataExtractorProps & ImageFileDataExtractorProps;

export declare const MultiUploader: NamedExoticComponent<MultiUploaderProps>;

export declare type MultiUploaderProps = UploaderBaseFieldProps & {
    fileType: FileType;
    children?: ReactNode;
};

declare type ProgressEvent_2 = {
    file: FileWithMeta;
    progress: FileUploadProgress;
    fileType: FileType;
};
export { ProgressEvent_2 as ProgressEvent }

export declare type S3FileOptions = Partial<GenerateUploadUrlMutationBuilder.FileParameters>;

export declare class S3UploadClient implements UploadClient<S3FileOptions> {
    readonly options: S3UploadClientOptions;
    private activeCount;
    private resolverQueue;
    constructor(options: S3UploadClientOptions);
    upload({ file, signal, onProgress, ...options }: UploadClientUploadArgs & S3FileOptions): Promise<{
        publicUrl: string;
    }>;
    private uploadSingleFile;
}

export declare interface S3UploadClientOptions {
    signUrl: S3UrlSigner;
    getUploadOptions?: (file: File) => S3FileOptions;
    concurrency?: number;
}

export declare type S3UrlSigner = (args: GenerateUploadUrlMutationBuilder.FileParameters & {
    file: File;
}) => Promise<GenerateUploadUrlMutationBuilder.ResponseBody>;

export declare type StartUploadEvent = {
    file: FileWithMeta;
    fileType: FileType;
};

export declare type SuccessEvent = {
    file: FileWithMeta;
    result: FileUploadResult;
    fileType: FileType;
};

export declare interface UploadClient<Options, // contains file-specific options
Result extends FileUploadResult = FileUploadResult> {
    upload: (args: UploadClientUploadArgs & Omit<Options, keyof UploadClientUploadArgs>) => Promise<Result>;
}

export declare interface UploadClientUploadArgs {
    file: File;
    signal: AbortSignal;
    onProgress: (progress: FileUploadProgress) => void;
}

export declare const Uploader: NamedExoticComponent<UploaderProps>;

export declare const UploaderBase: NamedExoticComponent<UploaderBaseProps>;

export declare type UploaderBaseFieldProps = {
    baseField?: SugaredRelativeSingleEntity['field'];
};

export declare type UploaderBaseProps = UploaderBaseFieldProps & {
    children: ReactNode;
};

export declare const UploaderClientContext: Context<UploadClient<any, FileUploadResult> | null>;

export declare const UploaderEachFile: ({ children, state, fallback }: {
    children: ReactNode;
    state?: UploaderFileState["state"] | UploaderFileState["state"][];
    fallback?: ReactNode;
}) => JSX_2.Element;

export declare class UploaderError extends Error {
    readonly options: UploaderErrorOptions;
    constructor(options: UploaderErrorOptions);
}

export declare interface UploaderErrorOptions {
    type: UploaderErrorType;
    endUserMessage?: string;
    developerMessage?: string;
    error?: unknown;
}

export declare const UploaderErrorsContext: Context<ErrorAccessor.Error[]>;

export declare type UploaderErrorType = 'fileRejected' | 'networkError' | 'httpError' | 'aborted' | 'timeout';

export declare type UploaderEvents = {
    onBeforeUpload: (event: BeforeUploadEvent) => Promise<FileType | undefined>;
    onStartUpload: (event: StartUploadEvent) => void;
    onProgress: (event: ProgressEvent_2) => void;
    onAfterUpload: (event: AfterUploadEvent) => Promise<void> | void;
    onSuccess: (event: SuccessEvent) => void;
    onError: (event: ErrorEvent_2) => void;
};

export declare type UploaderFileState = UploaderFileStateInitial | UploaderFileStateUploading | UploaderFileStateFinalizing | UploaderFileStateSuccess | UploaderFileStateError;

export declare const UploaderFileStateContext: Context<UploaderFileState>;

export declare type UploaderFileStateError = {
    state: 'error';
    file: FileWithMeta;
    error: unknown;
    dismiss: () => void;
};

export declare type UploaderFileStateFinalizing = {
    state: 'finalizing';
    file: FileWithMeta;
    result: FileUploadResult;
};

export declare type UploaderFileStateInitial = {
    state: 'initial';
    file: FileWithMeta;
};

export declare type UploaderFileStateSuccess = {
    state: 'success';
    file: FileWithMeta;
    result: FileUploadResult;
    dismiss: () => void;
};

export declare const UploaderFileStateSwitch: (props: UploaderFileStateSwitchProps) => ReactElement<any, string | JSXElementConstructor<any>> | null;

export declare interface UploaderFileStateSwitchProps {
    initial?: ReactElement | ComponentType<UploaderFileStateInitial>;
    uploading?: ReactElement | ComponentType<UploaderFileStateUploading>;
    finalizing?: ReactElement | ComponentType<UploaderFileStateFinalizing>;
    success?: ReactElement | ComponentType<UploaderFileStateSuccess>;
    error?: ReactElement | ComponentType<UploaderFileStateError>;
}

export declare type UploaderFileStateUploading = {
    state: 'uploading';
    file: FileWithMeta;
    progress: FileUploadProgress;
};

export declare const UploaderHasFile: ({ children, state, fallback }: {
    children: ReactNode;
    fallback?: ReactNode;
    state?: UploaderFileState["state"] | UploaderFileState["state"][];
}) => JSX_2.Element;

export declare interface UploaderOptions {
    multiple: boolean;
    accept: {
        [key: string]: string[];
    } | undefined;
}

export declare const UploaderOptionsContext: Context<UploaderOptions>;

export declare type UploaderProps = UploaderBaseFieldProps & {
    fileType: FileType;
    children?: ReactNode;
};

export declare type UploaderState = UploaderFileState[];

export declare const UploaderStateContext: Context<UploaderState>;

export declare const UploaderUploadFilesContext: Context<(files: File[]) => void>;

export declare const useMultiUploaderFileState: (entity: EntityAccessor) => UploaderFileState | undefined;

export declare const useS3Client: (options?: Partial<S3UploadClientOptions>) => S3UploadClient;

export declare const useUploaderClient: () => UploadClient<any, FileUploadResult> | null;

export declare const useUploaderErrors: () => ErrorAccessor.Error[];

export declare const useUploaderFileState: () => UploaderFileState;

export declare const useUploaderOptions: () => UploaderOptions;

export declare const useUploaderState: () => UploaderState;

export declare const useUploaderStateFiles: ({ state }?: UseUploaderStateFilesArgs) => UploaderState;

export declare type UseUploaderStateFilesArgs = {
    state?: UploaderFileState['state'] | UploaderFileState['state'][];
};

export declare const useUploaderUploadFiles: () => (files: File[]) => void;

export declare interface VideoFileDataExtractorProps {
    widthField?: SugaredRelativeSingleField['field'];
    heightField?: SugaredRelativeSingleField['field'];
    durationField?: SugaredRelativeSingleField['field'];
}

export declare type VideoFileTypeProps = FileType & FileUrlDataExtractorProps & GenericFileMetadataExtractorProps & VideoFileDataExtractorProps;

export { }
