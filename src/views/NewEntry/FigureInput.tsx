import React from 'react';
import {
    NumberInput,
    TextInput,
    Checkbox,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import {
    FigureFormProps,
    AgeFormProps,
    StrataFormProps,
    PartialForm,
} from '#types';
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
    value: PartialForm<FigureFormProps>;
    error: Error<FigureFormProps> | undefined;
    onChange: (value: PartialForm<FigureFormProps>, index: number) => void;
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

    const onValueChange = useFormObject(index, value, onChange);

    const handleAgeAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newAge: AgeFormProps = { uuid };
        onValueChange(
            [...(value.ageJson ?? []), newAge],
            'ageJson' as const,
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onAgeChange,
        onValueRemove: onAgeRemove,
    } = useFormArray('ageJson', value.ageJson ?? [], onValueChange);

    const handleStrataAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newStrata = { uuid };
        onValueChange(
            [...(value.strataJson ?? []), newStrata] as StrataFormProps[],
            'strataJson' as const,
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onStrataChange,
        onValueRemove: onStrataRemove,
    } = useFormArray('strataJson', value.strataJson ?? [], onValueChange);

    return (
        <>
            <div className={styles.actions}>
                <Button
                    name={undefined}
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
                    error={error?.fields?.districts}
                />
                <TextInput
                    label="Town / Village"
                    name="town"
                    value={value.town}
                    onChange={onValueChange}
                    error={error?.fields?.town}
                />
                <NumberInput
                    label="Household Size"
                    name="householdSize"
                    value={value.householdSize}
                    onChange={onValueChange}
                    error={error?.fields?.householdSize}
                />
            </div>
            <div className={styles.threeColumnRow}>
                <SelectInput
                    options={data?.quantifierList?.enumValues}
                    // FIXME: fix typing for EnumType
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Quantifier"
                    name="quantifier"
                    value={value.quantifier}
                    onChange={onValueChange}
                    error={error?.fields?.quantifier}
                />
                <NumberInput
                    label="Reported Figure"
                    name="reported"
                    value={value.reported}
                    onChange={onValueChange}
                    error={error?.fields?.reported}
                />
                <SelectInput
                    options={data?.unitList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Unit"
                    name="unit"
                    value={value.unit}
                    onChange={onValueChange}
                    error={error?.fields?.unit}
                />
            </div>
            <div className={styles.threeColumnRow}>
                <SelectInput
                    options={data?.termList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Term"
                    name="term"
                    value={value.term}
                    onChange={onValueChange}
                    error={error?.fields?.term}
                />
                <SelectInput
                    options={data?.typeList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Figure Type"
                    name="type"
                    value={value.type}
                    onChange={onValueChange}
                    error={error?.fields?.type}
                />
                <SelectInput
                    options={data?.roleList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Role"
                    name="role"
                    value={value.role}
                    onChange={onValueChange}
                    error={error?.fields?.role}
                />
            </div>
            <div className={styles.row}>
                <Checkbox
                    label="Disaggregated Data"
                    name="isDisaggregated"
                    // FIXME: typings of toggle-ui
                    value={value.isDisaggregated}
                    onChange={onValueChange}
                    // error={error?.fields?.isDisaggregated}
                />
            </div>
            { value.isDisaggregated && (
                <>
                    <div className={styles.twoColumnRow}>
                        <NumberInput
                            label="Urban displacement"
                            name="displacementUrban"
                            value={value.displacementUrban}
                            onChange={onValueChange}
                            error={error?.fields?.isDisaggregated}
                        />
                        <NumberInput
                            label="Rural displacement"
                            name="displacementRural"
                            value={value.displacementRural}
                            onChange={onValueChange}
                            error={error?.fields?.displacementRural}
                        />
                    </div>
                    <div className={styles.twoColumnRow}>
                        <NumberInput
                            label="In Camp"
                            name="locationCamp"
                            value={value.locationCamp}
                            onChange={onValueChange}
                            error={error?.fields?.locationCamp}
                        />
                        <NumberInput
                            label="Not in Camp"
                            name="locationNonCamp"
                            value={value.locationNonCamp}
                            onChange={onValueChange}
                            error={error?.fields?.locationNonCamp}
                        />
                    </div>
                    <div className={styles.twoColumnRow}>
                        <NumberInput
                            label="No. of Male"
                            name="sexMale"
                            value={value.sexMale}
                            onChange={onValueChange}
                            error={error?.fields?.sexMale}
                        />
                        <NumberInput
                            label="No. of Female"
                            name="sexFemale"
                            value={value.sexFemale}
                            onChange={onValueChange}
                            error={error?.fields?.sexFemale}
                        />
                    </div>
                    <div className={styles.block}>
                        <Header
                            size="small"
                            heading="Age"
                            actions={(
                                <Button
                                    name={undefined}
                                    className={styles.addButton}
                                    onClick={handleAgeAdd}
                                >
                                    Add Age
                                </Button>
                            )}
                        />
                        {value?.ageJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by age yet
                            </div>
                        ) : value?.ageJson?.map((age, i) => (
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
                                    name={undefined}
                                    className={styles.addButton}
                                    onClick={handleStrataAdd}
                                >
                                    Add Strata
                                </Button>
                            )}
                        />
                        {value?.strataJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by strata yet
                            </div>
                        ) : value?.strataJson?.map((strata, i) => (
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
                        <NumberInput
                            label="Conflict"
                            name="conflict"
                            value={value.conflict}
                            onChange={onValueChange}
                            error={error?.fields?.conflict}
                        />
                        <NumberInput
                            label="Political Conflict"
                            name="conflictPolitical"
                            value={value.conflictPolitical}
                            onChange={onValueChange}
                            error={error?.fields?.conflictPolitical}
                        />
                        <NumberInput
                            label="Criminal Conflict"
                            name="conflictCriminal"
                            value={value.conflictCriminal}
                            onChange={onValueChange}
                            error={error?.fields?.conflictCriminal}
                        />
                    </div>
                    <div className={styles.threeColumnRow}>
                        <NumberInput
                            label="Communal Conflict"
                            name="conflictCommunal"
                            value={value.conflictCommunal}
                            onChange={onValueChange}
                            error={error?.fields?.conflictCommunal}
                        />
                        <NumberInput
                            label="Other Conflict"
                            name="conflictOther"
                            value={value.conflictOther}
                            onChange={onValueChange}
                            error={error?.fields?.conflictOther}
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
                    // FIXME: typings of Checkbox
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
