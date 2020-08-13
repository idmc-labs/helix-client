import React, { useReducer } from 'react';

/*
import Validation, {
    requiredCondition,
    requiredStringCondition,
    greaterThanCondition,
    smallerThanCondition,
    blacklistCondition,
} from '#utils/validation';

import useForm from '#utils/form';
*/

import styles from './styles.css';

/*
interface Person{
    name: string | undefined;
    age: number | undefined;
    properties?: {
        location: string | undefined;
        price: number;
    }[];
    meta?: {
        species: string | undefined;
        uid: string | undefined;
    };
    favoriteNumbers: number[] | undefined;
}

const validation: Validation<Person> = {
    fields: {
        name: [requiredStringCondition],
        age: [requiredCondition, greaterThanCondition(10), smallerThanCondition(100)],
        properties: {
            member: {
                fields: {
                    location: [requiredStringCondition, blacklistCondition(['kathmandu'])],
                    price: [smallerThanCondition(100)],
                },
            },
        },
        meta: {
            fields: {
                species: [blacklistCondition(['homo sapiens'])],
                uid: [blacklistCondition(['0'])],
            },
        },
        favoriteNumbers: {
            member: [blacklistCondition([0])],
        },
    },
};
*/

function Home() {
    return (
        <div className={styles.home}>
            <h1 className={styles.heading}>
                Home
            </h1>
            <p className={styles.message}>
                This is your homepage.
            </p>
        </div>
    );
}

export default Home;
