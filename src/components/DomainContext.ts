import { createContext } from 'react';
import { MeQuery } from '#generated/types';
import { User, PurgeNull } from '#types';

interface DomainContext {
    user: User | undefined;
    setUser: (user: PurgeNull<MeQuery['me']> | undefined) => void;
    navbarVisibility: boolean;
    setNavbarVisibility: (visibility: boolean) => void;
    authenticated: boolean,
}

const DomainContext = createContext<DomainContext>({
    user: undefined,
    setUser: (user: PurgeNull<MeQuery['me']> | undefined) => {
        console.warn('Trying to set uset to ', user);
    },
    navbarVisibility: false,
    setNavbarVisibility: (visibility: boolean) => {
        console.warn('Trying to set navbar visibility to ', visibility);
    },
    authenticated: false,
});

export default DomainContext;
