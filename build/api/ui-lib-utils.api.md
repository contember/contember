## API Report File for "@contember/react-ui-lib"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { ClassValue } from 'clsx';
import { ComponentType } from 'react';
import * as React_2 from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';

// @public (undocumented)
export const cn: (...inputs: ClassValue[]) => string;

// Warning: (ae-forgotten-export) The symbol "ConfigSchema" needs to be exported by the entry point index.d.ts
// Warning: (ae-forgotten-export) The symbol "StringToBoolean" needs to be exported by the entry point index.d.ts
//
// @public (undocumented)
export type ConfigVariants<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
    [Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | null | undefined;
} : {};

// @public (undocumented)
type NoInfer_2<T> = T & {
    [K in keyof T]: T[K];
};
export { NoInfer_2 as NoInfer }

// Warning: (ae-forgotten-export) The symbol "Config" needs to be exported by the entry point index.d.ts
//
// @public (undocumented)
export const uic: <El extends React_2.ElementType, Variants extends ConfigSchema | undefined = undefined>(Component: El, config: Config<Variants, NoInfer_2<El>>) => React_2.ForwardRefExoticComponent<React_2.PropsWithoutRef<React_2.ComponentProps<El> & {
    asChild?: boolean;
    children?: React_2.ReactNode;
    className?: string;
} & ConfigVariants<Variants>> & React_2.RefAttributes<React_2.ElementRef<El>>>;

// @public (undocumented)
export const uiconfig: <T extends ConfigSchema | undefined>(config: Config<T, ComponentType<{}>>) => Config<T, React_2.ComponentType<{}>>;

// (No @packageDocumentation comment for this package)

```
