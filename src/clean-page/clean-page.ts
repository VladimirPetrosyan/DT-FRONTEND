//clean-page.ts
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {TuiButton, TuiLabel, TuiTextfield, TuiTextfieldComponent, TuiTextfieldDirective} from '@taiga-ui/core';
import {FormsModule} from '@angular/forms';
import {TuiInputNumberDirective, TuiRadioDirective} from '@taiga-ui/kit';
import {TuiRadio} from '@taiga-ui/kit';
import {KeyboardComponent} from '../keyboard/keyboard.component';

type Trend = 'up' | 'down' | 'disable';

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
@Component({
  selector: 'app-clean-page',
  imports: [TuiButton, TuiRadio, TuiTextfield, TuiTextfieldDirective, FormsModule, TuiTextfieldComponent, TuiLabel, TuiRadioDirective, TuiInputNumberDirective, KeyboardComponent],
  templateUrl: './clean-page.html',
  standalone: true,
  styleUrl: './clean-page.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})



export class CleanPage {
  increment: Increment = {
    temperature: { value: null, trend: 'disable' },
    time: { minutes: null, seconds: null, trend: 'disable' }
  };

  // Для радио-кнопок
  identityMatcher = (a: Trend, b: Trend) => a === b;

  // Активное поле для ввода
  activeField: 'temperature' | 'minutes' | 'seconds' | null = null;
  keyboardValue = '';

  onSecondsChange(value: number) {
    if (value > 60) {
      this.increment.time.seconds = 60;
    } else if (value < 0) {
      this.increment.time.seconds = 0;
    } else {
      this.increment.time.seconds = value;
    }
  }

  // Активация поля для ввода
  activateField(field: 'temperature' | 'minutes' | 'seconds') {
    this.activeField = field;
    this.keyboardValue = this.getFieldValue(field)?.toString() || '';
  }

  // Получение значения поля
  getFieldValue(field: 'temperature' | 'minutes' | 'seconds'): number | null {
    switch (field) {
      case 'temperature':
        return this.increment.temperature.value;
      case 'minutes':
        return this.increment.time.minutes;
      case 'seconds':
        return this.increment.time.seconds;
      default:
        return null;
    }
  }

  // Обработка нажатий клавиш
  onKeyPressed(key: string) {
    if (!this.activeField) return;

    console.log('Тип keyboardValue:', typeof this.keyboardValue);
    console.log('Значение keyboardValue:', this.keyboardValue);

    if (key === '{bksp}') {
      // Backspace
      this.keyboardValue = this.keyboardValue.slice(0, -1);
    } else if (key === '{enter}') {
      // Enter - сохраняем значение
      this.saveValue();
    } else if (key === '{arrowup}' || key === '{arrowdown}') {
      // Стрелки - можно использовать для изменения значения
      this.handleArrowKeys(key);
    } else if (key.match(/[0-9.]/)) {
      // Цифры и точка
      this.keyboardValue += key;
    }

    this.updateFieldValue();
  }

  // Обработка стрелок
  handleArrowKeys(key: string) {
    if (!this.activeField) return;

    const currentValue = this.getFieldValue(this.activeField) || 0;
    const step = key === '{arrowup}' ? 1 : -1;
    const newValue = currentValue + step;

    if (newValue >= 0) {
      this.keyboardValue = newValue.toString();
      this.updateFieldValue();
    }
  }

  // Сохранение значения
  saveValue() {
    if (!this.activeField) return;

    const numValue = parseFloat(this.keyboardValue);
    if (!isNaN(numValue)) {
      switch (this.activeField) {
        case 'temperature':
          this.increment.temperature.value = numValue;
          break;
        case 'minutes':
          this.increment.time.minutes = Math.floor(numValue);
          break;
        case 'seconds':
          this.increment.time.seconds = Math.floor(numValue);
          break;
      }
    }
    this.activeField = null;
    this.keyboardValue = '';
  }

  // Обновление значения поля
  updateFieldValue() {
    if (!this.activeField) return;

    const numValue = parseFloat(this.keyboardValue);
    if (!isNaN(numValue)) {
      switch (this.activeField) {
        case 'temperature':
          this.increment.temperature.value = numValue;
          break;
        case 'minutes':
          this.increment.time.minutes = Math.floor(numValue);
          break;
        case 'seconds':
          this.increment.time.seconds = Math.floor(numValue);
          break;
      }
    }
  }
}
