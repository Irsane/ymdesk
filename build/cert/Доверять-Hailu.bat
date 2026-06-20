@echo off
chcp 65001 >nul
REM Добавляет сертификат Hailu в доверенные, чтобы Windows SmartScreen
REM не ругался на установщик. Запускать от имени администратора.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Запустите этот файл от имени администратора ^(ПКМ -^> Запуск от имени администратора^).
  pause
  exit /b 1
)
set "CER=%~dp0hailu.cer"
echo Добавляю сертификат в доверенные корневые...
certutil -addstore -f Root "%CER%"
echo Добавляю сертификат в доверенные издатели...
certutil -addstore -f TrustedPublisher "%CER%"
echo.
echo Готово! Теперь установщик Hailu запускается без предупреждения SmartScreen.
pause
