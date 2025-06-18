import { DropzoneState } from 'react-dropzone';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { ReactNode } from 'react';

export declare const UploaderDropzoneArea: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

export declare const UploaderDropzoneInput: () => JSX_2.Element;

export declare const UploaderDropzoneRoot: ({ children, noInput }: {
    children: ReactNode;
    noInput?: boolean;
}) => JSX_2.Element;

export declare const useUploaderDropzoneState: () => DropzoneState;

export { }
