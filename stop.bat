@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title EduLive - Dừng Hệ thống Học trực tuyến

echo ==============================================================================
echo        🛑 EDULIVE - DỪNG TẤT CẢ DỊCH VỤ ĐANG HOẠT ĐỘNG
echo ==============================================================================
echo.

:: 1. Dừng Backend Spring Boot (Port 8088)
echo [1/4] Dừng Backend Spring Boot (Port 8088)...
set FOUND_BACKEND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8088" ^| findstr "LISTENING"') do (
    set FOUND_BACKEND=1
    echo   * Tắt tiến trình Backend [PID: %%a]...
    taskkill /F /PID %%a >nul 2>&1
)
if !FOUND_BACKEND! equ 0 (
    echo   - Không tìm thấy tiến trình Backend nào đang chạy.
) else (
    echo   ✓ Đã tắt Backend Spring Boot thành công.
)

:: 2. Dừng Frontend React Vite (Port 5173)
echo.
echo [2/4] Dừng Frontend React Vite (Port 5173)...
set FOUND_FRONTEND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    set FOUND_FRONTEND=1
    echo   * Tắt tiến trình Frontend [PID: %%a]...
    taskkill /F /PID %%a >nul 2>&1
)
if !FOUND_FRONTEND! equ 0 (
    echo   - Không tìm thấy tiến trình Frontend nào đang chạy.
) else (
    echo   ✓ Đã tắt Frontend Vite thành công.
)

:: 3. Đóng các cửa sổ Console EduLive
echo.
echo [3/4] Dọn dẹp các cửa sổ console EduLive...
taskkill /FI "WINDOWTITLE eq EduLive Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq EduLive Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq EduLive-WSL-Bridge*" /T /F >nul 2>&1
echo   ✓ Đã đóng các cửa sổ nền.

:: 4. Dừng Docker Container (nếu chạy qua Docker)
echo.
echo [4/4] Dọn dẹp Docker container (nếu có)...
docker compose -f docker-compose.prod.yml down >nul 2>&1
wsl -d Ubuntu -- docker stop edulive_postgres_dev >nul 2>&1 || wsl docker stop edulive_postgres_dev >nul 2>&1 || docker stop edulive_postgres_dev >nul 2>&1
echo   ✓ Đã giải phóng toàn bộ tài nguyên.

echo.
echo ==============================================================================
echo   ✅ TOÀN BỘ HỆ THỐNG EDULIVE ĐÃ ĐƯỢC DỪNG AN TOÀN!
echo ==============================================================================
echo.
pause
