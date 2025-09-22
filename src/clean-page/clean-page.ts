// clean-page.ts
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  TuiButton,
  TuiLabel,
  TuiTextfield,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiDialogService,
  TuiRoot,
} from '@taiga-ui/core';
import {
  TuiInputNumberDirective,
  TuiRadioDirective,
  TuiRadio, TUI_CONFIRM,
} from '@taiga-ui/kit';
import { KeyboardComponent } from '../keyboard/keyboard.component';
import {temperatureValidator} from './other/Validators';




interface Increment {
  temperature: {
    value: number | null;
    trend: Trend;
  };
  time: {
    minutes: number | null;
    seconds: number | null;
    trend: Trend;
  };
}


type Trend = 'Восходящий' | 'Нисходящий' | 'Отключено';

@Component({
  selector: 'app-clean-page',
  templateUrl: './clean-page.html',
  styleUrl: './clean-page.less',
  standalone: true,
  imports: [
    TuiButton, TuiRadio, TuiTextfield, TuiTextfieldDirective,
    TuiTextfieldComponent, TuiLabel, TuiRadioDirective, TuiInputNumberDirective,
    KeyboardComponent, ReactiveFormsModule, TuiRoot
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CleanPage {
  incrementForm!: FormGroup;
  activeField: 'temperature' | 'minutes' | 'seconds' | null = null;
  keyboardValue = '';
  lastSubmittedData: Increment | null = null;
  private readonly dialogs = inject(TuiDialogService);

  // Для радио-кнопок
  identityMatcher = (a: Trend, b: Trend) => a === b;
  constructor(
    private fb: FormBuilder,
) {}

  ngOnInit() {
    this.incrementForm = this.fb.group({
      temperature: this.fb.group({
        value: [null, [Validators.required, temperatureValidator]],
        trend: ['Отключено'],
      }),
      time: this.fb.group({
        minutes: [null, [Validators.required, Validators.min(0)]],
        seconds: [null, [Validators.required, Validators.min(0), Validators.max(59)]],
        trend: ['Отключено'],
      }),
    });
  }

  /** Активация поля */
  activateField(field: 'temperature' | 'minutes' | 'seconds') {
    this.activeField = field;
    this.keyboardValue = this.getFieldValue(field)?.toString() || '';
  }

  /** Обработка нажатий клавиш */
  onKeyPressed(key: string) {
    if (!this.activeField) return;

    if (key === '{bksp}') return this.handleBackspace(this.activeField);
    if (key === '{enter}') return this.saveValue();
    if (key === '{arrowup}' || key === '{arrowdown}') return this.handleArrowKeys(key);

    // Для минут и секунд — только цифры
    if (this.activeField === 'minutes' || this.activeField === 'seconds') {
      if (!/^[0-9]$/.test(key)) return;
      this.keyboardValue += key;
      return this.updateNumericField(this.activeField, this.keyboardValue);
    }

    // Для температуры
    if (this.activeField === 'temperature') {
      if (key === '.' && this.keyboardValue.includes('.')) return;

      const newValue = this.keyboardValue + key;
      // Проверяем через валидатор
      const control = this.getFormControl('temperature');
      control?.setValue(newValue);
      if (control?.invalid) return;
      this.keyboardValue = newValue;
    }
  }

  /** Обновление числового поля */
  private updateNumericField(field: 'minutes' | 'seconds', value: string) {
    let num = parseInt(value, 10);
    if (isNaN(num)) return;
    if (field === 'seconds') num = Math.min(59, Math.max(0, num));
    this.getFormControl(field)?.setValue(num);
  }

  /** Обработка стрелок */
  handleArrowKeys(key: string) {
    if (!this.activeField) return;
    const current = this.getFieldValue(this.activeField) || 0;
    const step = key === '{arrowup}' ? 1 : -1;
    const newValue = current + step;
    if (newValue < 0) return;

    this.keyboardValue = newValue.toString();
    if (this.activeField === 'minutes' || this.activeField === 'seconds') {
      this.updateNumericField(this.activeField, this.keyboardValue);
    } else {
      this.getFormControl('temperature')?.setValue(this.keyboardValue);
    }
  }

  /** Обработка Backspace */
  handleBackspace(field: 'temperature' | 'minutes' | 'seconds') {
    const control = this.getFormControl(field);
    if (!control) return;

    let value = control.value?.toString() || '';
    if (!value) return;

    if (field === 'temperature') {
      const pointIndex = value.indexOf('.');
      if (pointIndex >= 0) {
        // Если после точки есть цифры — удаляем последнюю цифру
        const decimalPartLength = value.length - pointIndex - 1;
        if (decimalPartLength > 0) value = value.slice(0, -1);
        else value = value.slice(0, pointIndex); // иначе удаляем точку
      } else {
        value = value.slice(0, -1);
      }
    } else {
      value = value.slice(0, -1);
    }

    control.setValue(value || null);
    this.keyboardValue = value || '';
  }

  /** Сохранение значения */
  saveValue() {
    if (!this.activeField) return;

    if (!this.keyboardValue.trim()) {
      this.resetField(this.activeField);
      return;
    }

    const num = parseFloat(this.keyboardValue);
    if (!isNaN(num)) this.getFormControl(this.activeField)?.setValue(num);

    this.keyboardValue = '';
    this.activeField = null;
  }

  /** Сброс поля */
  private resetField(field: 'temperature' | 'minutes' | 'seconds') {
    this.getFormControl(field)?.setValue(null);
    this.keyboardValue = '';
  }

  /** Получить значение поля */
  getFieldValue(field: 'temperature' | 'minutes' | 'seconds'): number | null {
    const val = this.getFormControl(field)?.value;
    return val != null ? val : null;
  }

  /** Получить контрол */
  getFormControl(field: 'temperature' | 'minutes' | 'seconds') {
    switch (field) {
      case 'temperature': return this.incrementForm.get('temperature.value');
      case 'minutes': return this.incrementForm.get('time.minutes');
      case 'seconds': return this.incrementForm.get('time.seconds');
    }
  }
  submitData():void {
    if (this.incrementForm.invalid) {
      this.incrementForm.markAllAsTouched();
      return;
    }
    const dataToSend: Increment = {
      temperature: {
        value: this.getFieldValue("temperature")?.valueOf() ?? null,
        trend: this.incrementForm.get('temperature.trend')?.value ?? 'Отключено',
      },
      time: {
        minutes: this.getFieldValue("minutes")?.valueOf() ?? null,
        seconds: this.getFieldValue("seconds")?.valueOf() ?? null,
        trend: this.incrementForm.get('time.trend')?.value ?? 'Отключено',
      },
    };
    console.log(dataToSend)
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        label: 'Проверка окна' ,
        size: 'm',
        data: 'какой-то текст',
      })
      .subscribe();
  }

// <span>Температура: ${dataToSend.temperature.value} °C, Тренд: ${dataToSend.temperature.trend}</span>
// <span>Время: ${dataToSend.time.minutes} мин ${dataToSend.time.seconds} сек, Тренд: ${dataToSend.time.trend}</span></div>



}
