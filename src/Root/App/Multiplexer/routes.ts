import { lazy } from 'react';

type Visibility = 'public' | 'protected' | 'exclusively-protected';

export interface Route {
    path: string;
    name: string;
    title: string;
    load: any;

    visibility?: Visibility;

    // hideNavbar?: boolean;
    // hideOnNavbar?: boolean;
}

export interface FallbackRoute {
    default: false;
    path: undefined;
    name: string;
    title: string;
    load: any;

    visibility?: Visibility;
    // hideNavbar?: boolean;
}

export type SomeRoute = Route | FallbackRoute;

const routeSettings: SomeRoute[] = [
    {
        path: '/',
        name: 'home',
        title: 'Home',
        load: lazy(() => import('../../../views/Home')),
    },
    {
        path: undefined,
        name: 'fourHundredFour',
        title: '404',
        load: lazy(() => import('../../../views/FourHundredFour')),
        default: false,
    },
];

export default routeSettings;
