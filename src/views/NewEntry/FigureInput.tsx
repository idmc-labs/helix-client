import React from 'react';
import {
    TextInput,
    Checkbox,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';

import { FigureFormProps } from '#types';
import Header from '#components/Header';
import {
    useFormObject,
    useFormArray,
} from '#utils/form';
import type { Error } from '#utils/schema';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import AgeInput from './AgeInput';
import StrataInput from './StrataInput';

import styles from './styles.css';

const FIGURE_OPTIONS = gql`
    query FigureOptions {
        quantifierList: __type(name: "QUANTIFIER") {
            name
            enumValues {
                name
                description
            }
        }
        unitList: __type(name: "UNIT") {
            name
            enumValues {
                name
                description
            }
        }
        termList: __type(name: "TERM") {
            name
            enumValues {
                name
                description
            }
        }
        roleList: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
        typeList: __type(name: "TYPE") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

interface FigureInputProps {
    index: number;
    value: FigureFormProps;
    error: Error<FigureFormProps> | undefined;
    onChange: (value: FigureFormProps, index: number) => void;
    onRemove: (index: number) => void;
}

function FigureInput(props: FigureInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
    } = props;

    const { data } = useQuery(FIGURE_OPTIONS);

    const [
        quantifierOptions,
        unitOptions,
        termOptions,
        roleOptions,
        typeOptions,
    ] = React.useMemo(() => [
        data?.quantifierList?.enumValues,
        data?.unitList?.enumValues,
        data?.termList?.enumValues,
        data?.roleList?.enumValues,
        data?.typeList?.enumValues,
    ], [data]);

    const onValueChange = useFormObject<number, FigureFormProps>(index, value, onChange);

    const handleAgeAdd = React.useCallback(() => {
        const uuid = new Date().getTime();
        const newAge = { uuid };
        onValueChange(
            [...value.ageJson, newAge],
            'ageJson',
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onAgeChange,
        onValueRemove: onAgeRemove,
    } = useFormArray('ageJson', value.ageJson, onValueChange);

    const handleStrataAdd = React.useCallback(() => {
        const uuid = new Date().getTime();
        const newStrata = { uuid };
        onValueChange(
            [...value.strataJson, newStrata],
            'strataJson',
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onStrataChange,
        onValueRemove: onStrataRemove,
    } = useFormArray('strataJson', value.strataJson, onValueChange);

    return (
        <>
            <div className={styles.actions}>
                <Button
                    disabled
                >
                    Clone
                </Button>
                <Button
                    name={index}
                    onClick={onRemove}
                >
                    Remove
                </Button>
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="District(s)"
                    name="districts"
                    value={value.districts}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Town / Village"
                    name="town"
                    value={value.town}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Household Size"
                    name="householdSize"
                    value={value.householdSize}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.threeColumnRow}>
                <SelectInput
                    options={quantifierOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Quantifier"
                    name="crisis"
                    value={value.crisis}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Reported Figure"
                    name="reported"
                    value={value.reported}
                    onChange={onValueChange}
                />
                <SelectInput
                    options={unitOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Unit"
                    name="unit"
                    value={value.unit}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.threeColumnRow}>
                <SelectInput
                    options={termOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Term"
                    name="term"
                    value={value.term}
                    onChange={onValueChange}
                />
                <SelectInput
                    options={typeOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Figure Type"
                    name="type"
                    value={value.type}
                    onChange={onValueChange}
                />
                <SelectInput
                    options={roleOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Role"
                    name="role"
                    value={value.role}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <Checkbox
                    label="Disaggregated Data"
                    name="isDisaggregated"
                    value={value.isDisaggregated}
                    onChange={onValueChange}
                />
            </div>
            { value.isDisaggregated && (
                <>
                    <div className={styles.twoColumnRow}>
                        <TextInput
                            label="Urban displacement"
                            name="displacementUrban"
                            value={value.displacementUrban}
                            onChange={onValueChange}
                        />
                        <TextInput
                            label="Rural displacement"
                            name="displacementRural"
                            value={value.displacementRural}
                            onChange={onValueChange}
                        />
                    </div>
                    <div className={styles.twoColumnRow}>
                        <TextInput
                            label="In Camp"
                            name="locationCamp"
                            value={value.locationCamp}
                            onChange={onValueChange}
                        />
                        <TextInput
                            label="Not in Camp"
                            name="locationNotCamp"
                            value={value.locationNotCamp}
                            onChange={onValueChange}
                        />
                    </div>
                    <div className={styles.twoColumnRow}>
                        <TextInput
                            label="No. of Male"
                            name="sexMale"
                            value={value.sexMale}
                            onChange={onValueChange}
                        />
                        <TextInput
                            label="No. of Female"
                            name="sexFemale"
                            value={value.sexFemale}
                            onChange={onValueChange}
                        />
                    </div>
                    <div className={styles.block}>
                        <Header
                            size="small"
                            heading="Age"
                            actions={(
                                <Button
                                    className={styles.addButton}
                                    onClick={handleAgeAdd}
                                >
                                    Add Age
                                </Button>
                            )}
                        />
                        {value.ageJson.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by age yet
                            </div>
                        ) : value.ageJson.map((age, i) => (
                            <AgeInput
                                key={age.uuid}
                                index={i}
                                value={age}
                                onChange={onAgeChange}
                                onRemove={onAgeRemove}
                                error={error?.fields?.ageJson?.members?.[age.uuid]}
                            />
                        ))}
                    </div>
                    <div className={styles.block}>
                        <Header
                            size="small"
                            heading="Strata"
                            actions={(
                                <Button
                                    className={styles.addButton}
                                    onClick={handleStrataAdd}
                                >
                                    Add Strata
                                </Button>
                            )}
                        />
                        {value.strataJson.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by strata yet
                            </div>
                        ) : value.strataJson.map((strata, i) => (
                            <StrataInput
                                key={strata.uuid}
                                index={i}
                                value={strata}
                                onChange={onStrataChange}
                                onRemove={onStrataRemove}
                                error={error?.fields?.strataJson?.members?.[strata.uuid]}
                            />
                        ))}
                    </div>
                    <div className={styles.threeColumnRow}>
                        <TextInput
                            label="Conflict"
                            name="conflict"
                            value={value.conflict}
                            onChange={onValueChange}
                        />
                        <TextInput
                            label="Political Conflict"
                            name="conflictPolitical"
                            value={value.conflictPolitical}
                            onChange={onValueChange}
                        />
                        <TextInput
                            label="Criminal Conflict"
                            name="conflictCriminal"
                            value={value.conflictCriminal}
                            onChange={onValueChange}
                        />
                    </div>
                    <div className={styles.threeColumnRow}>
                        <TextInput
                            label="Communal Conflict"
                            name="conflictCommunal"
                            value={value.conflictCommunal}
                            onChange={onValueChange}
                        />
                        <TextInput
                            label="Other Conflict"
                            name="conflictOther"
                            value={value.conflictOther}
                            onChange={onValueChange}
                        />
                    </div>
                </>
            )}
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Start date"
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                />
                {/*
                <TextInput
                    label="End date"
                    name="endDate"
                    value={value.endDate}
                    onChange={onValueChange}
                />
                */}
            </div>
            <div className={styles.row}>
                <Checkbox
                    label="Include in IDU"
                    name="includeIdu"
                    value={value.includeIdu}
                    onChange={onValueChange}
                />
            </div>
            { value.includeIdu && (
                <div className={styles.row}>
                    <TextInput
                        label="Excerpt for IDU"
                        name="excerptIdu"
                        value={value.excerptIdu}
                        onChange={onValueChange}
                    />
                </div>
            )}
        </>
    );
}

export default FigureInput;
