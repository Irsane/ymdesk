# Сборка приложения в .exe (Windows)

## 1. Подготовка

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install pyinstaller
```

## 2. Сборка

Один файл (portable, без установщика):

```bat
pyinstaller --noconfirm --onefile --windowed --name FonbetArb ^
  --add-data "fonbet_arb/sample_line.json;fonbet_arb" ^
  run.py
```

Готовый файл появится в `dist\FonbetArb.exe`.

Папка вместо одного файла (запускается быстрее, меньше ложных срабатываний
антивирусов):

```bat
pyinstaller --noconfirm --windowed --name FonbetArb ^
  --add-data "fonbet_arb/sample_line.json;fonbet_arb" ^
  run.py
```

> Иконку можно задать через `--icon app.ico`.

## 3. SmartScreen — как избежать предупреждения

SmartScreen ругается на **неподписанные** программы с низкой «репутацией».
Варианты по убыванию надёжности:

1. **Подпись кода (полное решение).** Купить сертификат Code Signing (обычный —
   репутация копится постепенно; **EV** — доверие сразу) и подписать .exe:
   ```bat
   signtool sign /fd SHA256 /a /tr http://timestamp.digicert.com /td SHA256 FonbetArb.exe
   ```
   Только это **полностью** убирает SmartScreen.

2. **Запуск локально без «метки интернета».** Если .exe не скачан из браузера, а
   собран/скопирован локально, метки Zone.Identifier нет и SmartScreen обычно
   молчит.

3. **Снять метку у скачанного файла:**
   - ПКМ по `FonbetArb.exe` → **Свойства** → внизу галочка **Разблокировать** → ОК;
   - или PowerShell: `Unblock-File .\FonbetArb.exe`.

4. **Запуск из исходников** (`python run.py`) SmartScreen не показывает вовсе —
   самый простой способ пользоваться без сборки.

Обещания «.exe совсем без SmartScreen без подписи» — неправда: это поведение
Windows, а не настройка приложения.
