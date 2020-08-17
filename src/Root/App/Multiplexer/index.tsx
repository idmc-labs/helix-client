import React, { Suspense, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Switch, Route } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import Navbar from '#components/Navbar';

import routes from './routes';
import styles from './styles.css';

interface TitleProps {
    value: string;
}
function Title({ value }: TitleProps) {
    useEffect(
        () => {
            document.title = value;
        },
        [value],
    );
    return null;
}

interface LoadingProps {
    message: string;
}
function Loading({ message }: LoadingProps) {
    return (
        <div className={styles.loading}>
            {message}
        </div>
    );
}

interface Me {
    me?: {
        username: string;
        email: string;
        id: number;
    }
}

// TODO: need to sync authentication status between tabs
// - use localstorage or sessionstorage
const ME = gql`
query GetMe {
  me {
    username
    email
    id
  }
}
`;

interface Props {
    className?: string;
}

function Multiplexer(props: Props) {
    const {
        className,
    } = props;

    const { loading, error, data } = useQuery<Me>(ME);

    if (loading) {
        return (
            <h1>
                Initializing...
            </h1>
        );
    }
    if (error) {
        return (
            <h1>
                Some error occured!
            </h1>
        );
    }

    const authenticated = !!data?.me;

    if (!authenticated) {
        return (
            <h1>
                Login to continue!
            </h1>
        );
    }

    return (
        <div className={_cs(className, styles.multiplexer)}>
            <Navbar
                className={styles.navbar}
            />
            <Suspense
                fallback={(
                    <Loading message="Please wait..." />
                )}
            >
                <Switch>
                    {routes.map((route) => {
                        const {
                            path,
                            name,
                            title,
                            // hideNavbar,
                            load: Loader,
                        } = route;

                        return (
                            <Route
                                exact
                                className={styles.route}
                                key={name}
                                path={path}
                                render={() => (
                                    <>
                                        <Title value={title} />
                                        <Loader className={styles.view} />
                                    </>
                                )}
                            />
                        );
                    })}
                </Switch>
            </Suspense>
        </div>
    );
}
export default Multiplexer;
