import deepEqual from '../utils/deepEqual';
import isNullOrUndefined from '../utils/isNullOrUndefined';
import isObject from '../utils/isObject';
import isPrimitive from '../utils/isPrimitive';
import isUndefined from '../utils/isUndefined';
import objectHasFunction from '../utils/objectHasFunction';

function markFieldsDirty<T>(data: T, fields: Record<string, any> = {}) {
  const isParentNodeArray = Array.isArray(data);

  if (isObject(data) || isParentNodeArray) {
    for (const key in data) {
      const value = data[key];

      if (
        Array.isArray(value) ||
        (isObject(value) && !objectHasFunction(value))
      ) {
        fields[key] = Array.isArray(value) ? [] : {};
        markFieldsDirty(value, fields[key]);
      } else if (!isNullOrUndefined(value)) {
        fields[key] = true;
      }
    }
  }

  return fields;
}

function getDirtyFieldsFromDefaultValues<T>(
  data: T,
  formValues: T,
  dirtyFieldsFromValues: Record<
    Extract<keyof T, string>,
    ReturnType<typeof markFieldsDirty> | boolean
  >,
) {
  const isParentNodeArray = Array.isArray(data);

  if (isObject(data) || isParentNodeArray) {
    for (const key in data) {
      const value = data[key];

      if (
        Array.isArray(value) ||
        (isObject(value) && !objectHasFunction(value))
      ) {
        if (
          isUndefined(formValues) ||
          isPrimitive(dirtyFieldsFromValues[key])
        ) {
          dirtyFieldsFromValues[key] = Array.isArray(value)
            ? markFieldsDirty(value, [])
            : { ...markFieldsDirty(value) };
        } else {
          getDirtyFieldsFromDefaultValues(
            value,
            isNullOrUndefined(formValues) ? {} : formValues[key],
            dirtyFieldsFromValues[key],
          );
        }
      } else {
        const formValue = formValues[key];
        dirtyFieldsFromValues[key] = !deepEqual(value, formValue);
      }
    }
  }

  return dirtyFieldsFromValues;
}

export default <T>(defaultValues: T, formValues: T) =>
  getDirtyFieldsFromDefaultValues(
    defaultValues,
    formValues,
    markFieldsDirty(formValues),
  );
