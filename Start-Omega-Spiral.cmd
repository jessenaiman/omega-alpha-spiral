@echo off
setlocal
cd /d "%~dp0.worktrees\alpha-0.1"
if errorlevel 1 goto missing
where npm.cmd >nul 2>nul
if errorlevel 1 goto nonode
if not exist node_modules\vite\bin\vite.js goto missing
 echo Starting Omega Spiral at http://127.0.0.1:5189/
 echo Keep this window open while playing. Press Ctrl+C here when finished.
call npm.cmd run dev -- --port 5189 --open
 echo.
 echo If port 5189 is already in use, open http://127.0.0.1:5189/ in your browser.
pause
exit /b
:missing
 echo Game files are missing. Expected .worktrees\alpha-0.1 beside this launcher.
pause
exit /b 1
:nonode
 echo Node.js/npm was not found on PATH. Reopen this launcher after Node is available.
pause
exit /b 1
