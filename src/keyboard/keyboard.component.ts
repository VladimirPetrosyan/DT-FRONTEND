import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import Keyboard from 'simple-keyboard';
import { LangLayounts, layounts } from './keyboard.layouts';

const KeyboardIconsMap = new Map<string, string>([
  ['{lock}', '--t-icon-start: url(assets/taiga-ui/icons/arrow-big-up-dash.svg);'],
  ['{bksp}', '--t-icon-start: url(assets/taiga-ui/icons/delete.svg);'],
  ['{shift}', '--t-icon-start: url(assets/taiga-ui/icons/arrow-big-up.svg);'],
  ['{enter}', '--t-icon-start: url(assets/taiga-ui/icons/corner-down-left.svg);'],
  ['{space}', '--t-icon-start: url(assets/taiga-ui/icons/space.svg);'],
  ['{tab}', '--t-icon-start: url(assets/taiga-ui/icons/arrow-right-to-line.svg);'],
  ['{lang}', '--t-icon-start: url(assets/taiga-ui/icons/globe.svg);'],
  ['{arrowup}', '--t-icon-start: url(assets/taiga-ui/icons/arrow-up.svg);'],
  ['{arrowdown}', '--t-icon-start: url(assets/taiga-ui/icons/arrow-down.svg);'],
  ['{plus_minus}', '--t-icon-start: url(assets/taiga-ui/icons/diff.svg);'],
]);

@Component({
  selector: 'app-keyboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './keyboard.component.html',
  styleUrl: './keyboard.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class KeyboardComponent implements AfterViewInit, OnInit {
  @Input()
  set input(value: string) {
    if (this.keyboard !== undefined) {
      this.keyboard.clearInput();
      this.keyboard.replaceInput({ default: value });
    }
  }
  @Output() valueChanged = new EventEmitter<string>();
  @Output() keyReleased = new EventEmitter<string>();
  @Output() keyPressed = new EventEmitter<string>();

  @Input() digital = false;
  @Input() dotDigital = false; // digital с точкой
  @Input() dotDigitalPlusMinus = false; // digital с +/-
  @Input() langs: string[] = ['ru', 'en'];

  @Input()
  set disableDot(value: boolean) {
    this._disableDot = value;
    this.updateKeyboard();
  }

  get disableDot(): boolean {
    return this._disableDot;
  }

  protected keyboard!: Keyboard;
  private shiftStart!: number;
  private shiftLock = false;
  private langLayounts!: LangLayounts;
  private _disableDot = false;
  private buttonListeners: (() => void)[] = [];


  @ViewChild('container', { static: true }) container!: ElementRef;

  constructor(
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.langLayounts = new LangLayounts(this.langs);
  }
  ngOnDestroy(): void {
    if (this.keyboard) {
      this.keyboard.destroy();
    }

    this.buttonListeners.forEach(unlisten => unlisten());
    this.buttonListeners = [];
  }

  ngAfterViewInit() {
    let layountName = this.langLayounts.default;

    if (this.dotDigital) {
      layountName = 'dot_digital';
    } else if (this.digital) {
      layountName = 'digital';
    } else if (this.dotDigitalPlusMinus) {
      layountName = 'dot_digital_plus_minus';
    }

    this.keyboard = new Keyboard({
      useButtonTag: true,
      onChange: (input) => this.onChange(input),
      onKeyPress: (button) => this.onKeyPress(button),
      onKeyReleased: (button) => this.onKeyReleased(button),
      theme: 'hg-theme-default tui-theme',
      layout: layounts,
      layoutName: layountName,
      display: { '{numbers}': '123', '{abc}': 'ABC' },
    });

    this.updateKeyboard();
  }

  private updateKeyboard() {
    this.buttonListeners.forEach((unlisten) => unlisten());
    this.buttonListeners = [];

    const buttons = this.container.nativeElement.querySelectorAll('button');

    buttons.forEach((button: any) => {
      this.renderer.setAttribute(button, 'tuibutton', '');
      this.renderer.setAttribute(button, 'tuiappearance', '');
      this.renderer.setAttribute(button, 'data-appearance', 'whiteblock');
      this.renderer.setAttribute(button, 'tabindex', '-1');
      this.renderer.addClass(button, 'keyboard-button');

      // не angular-way, но единственный более или менее корректный
      // способ при динамическом создании элементов из js
      const unlisten = this.renderer.listen(button, 'click', () => {
        // Звук удален
      });
      this.buttonListeners.push(unlisten);

      let attr = button.getAttribute('data-skbtn');

      if (attr === '{shift}' && this.shiftLock) attr = '{lock}';

      const value = KeyboardIconsMap.get(attr);

      if (value !== undefined) {
        this.renderer.setAttribute(button, 'tuiicons', '');
        this.renderer.setAttribute(button, 'tuiiconbutton', '');
        this.renderer.setAttribute(button, 'style', value);
      }

      if ((this.dotDigital || this.dotDigitalPlusMinus) && attr === '.') {
        if (this._disableDot) {
          this.renderer.setStyle(button, 'pointer-events', 'none');
          this.renderer.setProperty(button, 'disabled', true);
        } else {
          this.renderer.setStyle(button, 'pointer-events', 'auto');
          this.renderer.setProperty(button, 'disabled', false);
        }
      }

      if (attr === '{plus_minus}') {
        this.renderer.addClass(button, 'keyboard-plusminus');
      }
    });
  }

  private onChange = (input: string) => {
    this.valueChanged.emit(input);
  };

  private onKeyPress = (button: string) => {
    this.shiftStart = performance.now();
    this.keyPressed.emit(button);
  };

  private onKeyReleased = (button: string) => {
    const shiftEnd = performance.now();
    const duration = shiftEnd - this.shiftStart;
    this.handleShift(button, duration >= 1000);

    this.keyReleased.emit(button);
  };

  handleShift = (button: string, isLongTap: boolean) => {
    const currentLayout = this.keyboard.options.layoutName;
    let newLayount = currentLayout;

    // не трогаем digital-раскладки
    if (currentLayout === 'digital' || currentLayout === 'dot_digital' || currentLayout === 'dot_digital_plus_minus') {
      return;
    }

    if (button === '{shift}' && isLongTap) {
      this.shiftLock = !this.shiftLock;
    }

    if (button === '{lang}') {
      this.langLayounts.next();
    } else if (button === '{numbers}') {
      newLayount = 'numbers';
    } else if (button === '{abc}') {
      newLayount = this.langLayounts.default;
    }

    if (this.shiftLock) {
      newLayount = this.langLayounts.shift;
    } else if (button === '{shift}') {
      newLayount = currentLayout === this.langLayounts.default ? this.langLayounts.shift : this.langLayounts.default;
    } else if (
      newLayount !== 'numbers' &&
      newLayount !== 'digital' &&
      newLayount !== 'dot_digital' &&
      newLayount !== 'dot_digital_plus_minus'
    ) {
      // сбрасываем только если не цифровая раскладка
      newLayount = this.langLayounts.default;
    }

    if (newLayount !== currentLayout) {
      this.keyboard.setOptions({
        layoutName: newLayount,
      });
      this.updateKeyboard();
    }
  };
}
