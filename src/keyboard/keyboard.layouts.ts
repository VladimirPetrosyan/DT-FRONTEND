export const layounts = {
  digital: ['7 8 9 {bksp}', '4 5 6 {arrowup}', '1 2 3 {arrowdown}', '0 . {enter}'],
};

export class LangLayounts {
  langs: string[];
  name!: string;
  default!: string;
  shift!: string;
  private idx = 0;

  constructor(langs: string[]) {
    this.langs = langs;
    this.update();
  }

  private update() {
    this.name = this.langs[this.idx];
    this.default = 'digital'; // Всегда используем цифровую раскладку
    this.shift = 'digital'; // Shift не нужен для цифровой клавиатуры
  }

  next() {
    this.idx = ++this.idx % this.langs.length;
    this.update();
  }
}
