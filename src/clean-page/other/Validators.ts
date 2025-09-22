import {AbstractControl, ValidationErrors} from '@angular/forms';

export function temperatureValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.toString() || '';

  // Пустое значение допустимо
  if (!value) return null;

  // Разрешаем только цифры и максимум одну точку
  if (!/^\d*\.?\d*$/.test(value)) {
    return { invalidTemperature: true };
  }

  // Если есть точка — проверяем количество знаков после нее
  const parts = value.split('.');
  if (parts[1] && parts[1].length > 2) {
    return { invalidTemperature: true };
  }

  return null; // Всё ок
}
