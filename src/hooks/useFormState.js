import { useState, useCallback } from 'react';

/**
 * Hook pour gérer l'état d'un formulaire local simplement
 * @param {Object} initialState État initial des valeurs du formulaire
 * @param {Object} validators Objet contenant des fonctions de validation par champ
 */
export const useFormState = (initialState = {}, validators = {}) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    setValues((prev) => ({ ...prev, [name]: finalValue }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleValueChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validators).forEach((key) => {
      const validator = validators[key];
      const errorMessage = validator(values[key], values);
      if (errorMessage) {
        newErrors[key] = errorMessage;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validators]);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setIsSubmitting(false);
  }, [initialState]);

  return {
    values,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleValueChange,
    validate,
    reset,
    setValues,
    setErrors
  };
};

export default useFormState;