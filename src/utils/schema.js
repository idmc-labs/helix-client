import {
    isObject,
    isList,
    isFalsy,
    isTruthy,
    findDifferenceInList,
    isNotDefined,
} from '@togglecorp/fujs';

const emptyObject = {};
const emptyArray = [];

const hasNoKeys = (obj) => (
    isFalsy(obj) || Object.keys(obj).length === 0
);

const hasNoValues = (array) => (
    isFalsy(array) || array.length <= 0 || array.every((e) => isFalsy(e))
);

export const accumulateValues = (obj, schema, settings = {}) => {
    const {
        noFalsyValues = false,
        falsyValue = undefined,
    } = settings;

    // NOTE: if schema is array, the object is the node element
    const {
        member,
        fields,
        keySelector,
    } = schema;
    const isSchemaForLeaf = isList(schema);
    const isSchemaForArray = (!!member && !!keySelector);
    const isSchemaForObject = !!fields;

    if (isSchemaForLeaf) {
        if (isNotDefined(obj) && !noFalsyValues) {
            return falsyValue;
        }
        return obj;
    }
    if (isSchemaForArray) {
        const safeObj = obj || emptyArray;
        const values = [];
        safeObj.forEach((element) => {
            const localMember = member;
            const value = accumulateValues(element, localMember, settings);
            values.push(value);
        });
        if (hasNoValues(values)) {
            return noFalsyValues ? emptyArray : falsyValue;
        }
        return values;
    }
    if (isSchemaForObject) {
        const safeObj = obj || emptyObject;
        const values = {};
        const localFields = fields;
        Object.keys(localFields).forEach((fieldName) => {
            const value = accumulateValues(safeObj[fieldName], localFields[fieldName], settings);
            if (value !== undefined) {
                values[fieldName] = value;
            }
        });
        // FIXME: don't copy values if there is nothing to be cleared
        if (hasNoKeys(values)) {
            return noFalsyValues ? emptyObject : falsyValue;
        }
        return values;
    }

    console.error('Accumulate Value: Schema is invalid for ', schema);
    return undefined;
};

export const accumulateErrors = (obj, schema) => {
    const {
        member,
        fields,
        validation,
        keySelector,
    } = schema;
    const isSchemaForLeaf = isList(schema);
    const isSchemaForArray = (!!member && !!keySelector);
    const isSchemaForObject = !!fields;

    if (isSchemaForLeaf) {
        let error;
        schema.every((rule) => {
            const message = rule(obj);
            if (message) {
                error = message;
            }
            return !message;
        });
        return error;
    }

    const errors = {};
    if (validation) {
        const validationErrors = validation(obj);
        if (validationErrors) {
            errors.$internal = validationErrors;
        }
    }
    if (isSchemaForArray) {
        const safeObj = obj || emptyArray;
        safeObj.forEach((element) => {
            const localMember = member;
            const fieldError = accumulateErrors(element, localMember);
            if (fieldError) {
                const index = keySelector(element);
                if (!errors.members) {
                    errors.members = {};
                }
                errors.members[index] = fieldError;
            }
        });
        return hasNoKeys(errors.members) && !errors.$internal ? undefined : errors;
    }
    if (isSchemaForObject) {
        const safeObj = obj || emptyObject;
        const localFields = fields;
        Object.keys(localFields).forEach((fieldName) => {
            const fieldError = accumulateErrors(safeObj[fieldName], localFields[fieldName]);
            if (fieldError) {
                if (!errors.fields) {
                    errors.fields = {};
                }
                errors.fields[fieldName] = fieldError;
            }
        });
        return hasNoKeys(errors.fields) && !errors.$internal ? undefined : errors;
    }

    console.error('Accumulate Error: Schema is invalid for ', schema);
    return undefined;
};

export const accumulateDifferentialErrors = (
    oldObj,
    newObj,
    oldError,
    schema,
) => {
    if (oldObj === newObj) {
        return oldError;
    }
    // NOTE: if schema is array, the object is the node element
    const {
        member,
        fields,
        validation,
        keySelector,
    } = schema;
    const isSchemaForLeaf = isList(schema);
    const isSchemaForArray = !!member && !!keySelector;
    const isSchemaForObject = !!fields;

    if (isSchemaForLeaf) {
        let error;
        schema.every((rule) => {
            const message = rule(newObj);
            if (message) {
                error = message;
            }
            return !message;
        });
        return error;
    }

    const errors = {};
    if (validation) {
        const validationErrors = validation(newObj);
        if (validationErrors) {
            errors.$internal = validationErrors;
        }
    }

    if (isSchemaForArray) {
        const safeOldObj = oldObj || emptyArray;
        const safeNewObj = newObj || emptyArray;
        const safeOldError = oldError || emptyObject;

        const {
            unmodified,
            modified,
        } = findDifferenceInList(safeOldObj, safeNewObj, keySelector);

        unmodified.forEach((e) => {
            const index = keySelector(e);
            if (!errors.members) {
                errors.members = {};
            }
            errors.members[index] = safeOldError[index];
        });

        modified.forEach((e) => {
            const localMember = member;
            const index = keySelector(e.new);
            const forgetOldError = false;
            const fieldError = accumulateDifferentialErrors(
                e.old,
                e.new,
                forgetOldError ? undefined : safeOldError[index],
                localMember,
            );
            if (fieldError) {
                if (!errors.members) {
                    errors.members = {};
                }
                errors.members[index] = fieldError;
            }
        });

        return hasNoKeys(errors.members) && !errors.$internal ? undefined : errors;
    }
    if (isSchemaForObject) {
        const safeOldObj = oldObj || emptyObject;
        const safeNewObj = newObj || emptyObject;

        const forgetOldError = false;

        // FIXME: forgetOldError can be made a lot better if it only clears
        // error for fields that have validations changed
        const safeOldError = (!forgetOldError && oldError) || emptyObject;
        const localFields = fields;

        Object.keys(localFields).forEach((fieldName) => {
            if (safeOldObj[fieldName] === safeNewObj[fieldName] && safeOldError[fieldName]) {
                if (!errors.fields) {
                    errors.fields = {};
                }
                errors.fields[fieldName] = safeOldError[fieldName];
                return;
            }
            const fieldError = accumulateDifferentialErrors(
                safeOldObj[fieldName],
                safeNewObj[fieldName],
                safeOldError[fieldName],
                localFields[fieldName],
            );
            if (fieldError) {
                if (!errors.fields) {
                    errors.fields = {};
                }
                errors.fields[fieldName] = fieldError;
            }
        });
        return hasNoKeys(errors.fields) && !errors.$internal ? undefined : errors;
    }

    console.error('Accumulate Differential Error: Schema is invalid for ', schema);
    return undefined;
};

export const analyzeErrors = (errors) => {
    // handles undefined, null
    if (isFalsy(errors)) {
        return false;
    }
    if (errors.$internal) {
        return true;
    }
    if (errors.fields) {
        // handles empty object {}
        const keys = Object.keys(errors.fields);
        if (keys.length === 0) {
            return false;
        }
        return keys.some((key) => {
            const subErrors = errors.fields[key];
            // handles object
            if (isObject(subErrors)) {
                return analyzeErrors(subErrors);
            }
            // handles string or array of strings
            return isTruthy(subErrors);
        });
    }
    if (errors.members) {
        // handles empty object {}
        const keys = Object.keys(errors.members);
        if (keys.length === 0) {
            return false;
        }
        return keys.some((key) => {
            const subErrors = errors.members[key];
            // handles object
            if (isObject(subErrors)) {
                return analyzeErrors(subErrors);
            }
            // handles string or array of strings
            return isTruthy(subErrors);
        });
    }
    return false;
};
