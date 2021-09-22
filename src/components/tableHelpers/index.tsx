import { compareString } from '@togglecorp/fujs';
import {
    TableHeaderCell,
    TableHeaderCellProps,
    TableColumn,
    TableSortDirection,
    TableFilterType,
} from '@togglecorp/toggle-ui';

import { RouteData, Attrs } from '#hooks/useRouteMatching';
import Link, { LinkProps } from './Link';
import ExternalLink, { ExternalLinkProps } from './ExternalLink';
import StatusLink, { Props as StatusLinkProps } from './StatusLink';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import Text, { TextProps } from './Text';
import styles from './styles.css';

type Size = 'small' | 'medium' | 'large';

function getWidthFromSize(size: Size | undefined) {
    switch (size) {
        case 'small':
            return 60;
        case 'medium':
            return 120;
        case 'large':
            return 240;
        default:
            return undefined;
    }
}

export interface ColumnOptions {
    sortable?: boolean,
    defaultSortDirection?: TableSortDirection,
    filterType?: TableFilterType,
    orderable?: boolean;
    hideable?: boolean;
    columnClassName?: string,
}

export function createLinkColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        title: string | undefined | null,
        attrs?: Attrs,
    } | undefined | null,
    route: RouteData,
    options?: ColumnOptions,
    size?: Size,
) {
    const item: TableColumn<D, K, LinkProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: Link,
        cellRendererParams: (_: K, datum: D): LinkProps => {
            const value = accessor(datum);
            return {
                title: value?.title,
                attrs: value?.attrs,
                route,
            };
        },
        valueSelector: (it) => accessor(it)?.title,
        valueComparator: (foo: D, bar: D) => compareString(
            accessor(foo)?.title,
            accessor(bar)?.title,
        ),
        cellRendererClassName: styles.linkCell,
    };
    return item;
}

export function createExternalLinkColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        title: string | undefined | null,
        link: string | undefined | null,
    } | undefined | null,
    options?: ColumnOptions,
    size?: Size,
) {
    const item: TableColumn<D, K, ExternalLinkProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: ExternalLink,
        cellRendererParams: (_: K, datum: D): ExternalLinkProps => {
            const value = accessor(datum);
            return {
                title: value?.title,
                link: value?.link,
            };
        },
        valueSelector: (it) => accessor(it)?.title,
        valueComparator: (foo: D, bar: D) => compareString(
            accessor(foo)?.title,
            accessor(bar)?.title,
        ),
        cellRendererClassName: styles.linkCell,
    };
    return item;
}

export function createTextColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => string | undefined | null,
    options?: ColumnOptions,
    size?: Size,
) {
    const item: TableColumn<D, K, TextProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: Text,
        cellRendererParams: (_: K, datum: D): TextProps => ({
            value: accessor(datum),
        }),
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareString(accessor(foo), accessor(bar)),
    };
    return item;
}

export function createStatusColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        isReviewed: boolean | undefined | null,
        isSignedOff: boolean | undefined | null,
        isUnderReview: boolean | undefined | null,
        title: string | undefined | null,
        attrs?: Attrs,
    } | undefined | null,
    route: RouteData,
    options?: ColumnOptions,
    size?: Size,
) {
    const item: TableColumn<D, K, StatusLinkProps, TableHeaderCellProps> = {
        id,
        title,
        headerCellRenderer: TableHeaderCell,
        columnWidth: getWidthFromSize(size),
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: StatusLink,
        cellRendererParams: (_: K, datum: D): StatusLinkProps => {
            const value = accessor(datum);
            return {
                title: value?.title,
                attrs: value?.attrs,
                route,
                isReviewed: value?.isReviewed,
                isSignedOff: value?.isSignedOff,
                isUnderReview: value?.isUnderReview,
            };
        },
    };
    return item;
}

export function createActionColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        id: string,
        onEdit: ((id?: string | undefined) => void) | undefined,
        onDelete: ((id: string) => void) | undefined,
    },
    options?: ColumnOptions,
    size?: Size,
) {
    const item: TableColumn<D, K, ActionProps, TableHeaderCellProps> = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: ActionCell,
        cellRendererParams: (_: K, datum: D): ActionProps => {
            const value = accessor(datum);
            return {
                id: value.id,
                onEdit: value.onEdit,
                onDelete: value.onDelete,
            };
        },
    };
    return item;
}
