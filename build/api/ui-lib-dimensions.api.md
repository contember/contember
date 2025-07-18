## API Report File for "@contember/react-ui-lib"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { DataViewSortingDirections } from '@contember/react-dataview';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';
import { SugaredQualifiedEntityList } from '@contember/interface';
import { SugaredRelativeSingleEntity } from '@contember/interface';
import { SugaredRelativeSingleField } from '@contember/interface';

// @public (undocumented)
export const DimensionLabel: ({ label, dimensionValue }: {
    label: ReactNode;
    dimensionValue: ReactNode;
}) => JSX_2.Element;

// @public (undocumented)
export const DimensionsSwitcher: NamedExoticComponent<DimensionsSwitcherProps>;

// @public (undocumented)
export type DimensionsSwitcherProps = {
    options: SugaredQualifiedEntityList['entities'];
    orderBy?: DataViewSortingDirections;
    dimension: string;
    children: ReactNode;
    slugField: SugaredRelativeSingleField['field'];
    isMulti?: boolean;
};

// @public (undocumented)
export type RenderLabelProps = {
    label: ReactNode;
    dimensionValue: string | null;
};

// @public (undocumented)
export const SideDimensions: NamedExoticComponent<SideDimensionsProps>;

// @public (undocumented)
export type SideDimensionsProps = {
    dimension: string;
    as: string;
    field: SugaredRelativeSingleEntity['field'];
    children: ReactNode;
    renderLabel?: ({ label, dimensionValue }: RenderLabelProps) => ReactNode;
};

// (No @packageDocumentation comment for this package)

```
