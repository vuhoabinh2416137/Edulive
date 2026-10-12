@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title EduLive - Khởi động Hệ thống Học trực tuyến

echo ==============================================================================
echo        🎓 EDULIVE - HỆ THỐNG HỌC TRỰC TUYẾN THÔNG MINH (MONOREPO)
echo ==============================================================================
echo.

:: 1. Kiểm tra & Khởi động Database PostgreSQL
echo [1/4] Kiểm tra Cơ sở dữ liệu PostgreSQL (Port 5432)...
netstat -ano | findstr ":5432" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   ✓ PostgreSQL [Port 5432] đang sẵn sàng hoạt động.
) else (
    echo   * Đang kích hoạt container PostgreSQL...
    wsl -d Ubuntu -- docker start edulive_postgres_dev >nul 2>&1 || wsl docker start edulive_postgres_dev >nul 2>&1 || docker start edulive_postgres_dev >nul 2>&1 || docker compose -f deploy/docker-compose.dev.yml up -d >nul 2>&1
    timeout /t 3 >nul
    netstat -ano | findstr ":5432" | findstr "LISTENING" >nul
    if !errorlevel! neq 0 (
        if exist "wsl-pg-bridge.js" (
            echo   * Đang kết nối mạng WSL PostgreSQL bridge...
            start "EduLive-WSL-Bridge" /min node wsl-pg-bridge.js
            timeout /t 2 >nul
        )
    )
    
    :: Chờ PostgreSQL mở cổng 5432
    set /a PG_WAIT=0
    :wait_pg
    netstat -ano | findstr ":5432" | findstr "LISTENING" >nul
    if !errorlevel! neq 0 (
        set /a PG_WAIT+=1
        if !PG_WAIT! leq 10 (
            timeout /t 1 >nul
            goto wait_pg
        )
    )
    echo   ✓ Đã sẵn sàng kết nối PostgreSQL.
)

:: 2. Khởi động Backend Spring Boot
echo.
echo [2/4] Khởi động Backend Spring Boot 3 (Port 8088)...
netstat -ano | findstr ":8088" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   ✓ Backend Spring Boot đã đang chạy trên Port 8088.
) else (
    echo   * Đang khởi động Backend trong cửa sổ riêng biệt...
    start "EduLive Backend (Spring Boot 3 - Port 8088)" cmd /k "cd /d %~dp0backend && .\mvnw.cmd spring-boot:run"
    <nul set /p="  * Đang chờ Backend khởi động hoàn tất (khoảng 10-15s)"
    set /a BE_WAIT=0
    :wait_be
    netstat -ano | findstr ":8088" | findstr "LISTENING" >nul
    if !errorlevel! neq 0 (
        set /a BE_WAIT+=1
        if !BE_WAIT! leq 40 (
            timeout /t 1 >nul
            <nul set /p=.
            goto wait_be
        ) else (
            echo.
            echo   ⚠️ Cảnh báo: Backend chưa phản hồi sau 40s. Vui lòng kiểm tra cửa sổ Backend console.
        )
    ) else (
        echo.
        echo   ✓ Backend Spring Boot đã khởi động thành công trên Port 8088!
    )
)

:: 3. Khởi động Frontend React Vite
echo.
echo [3/4] Khởi động Frontend React Vite (Port 5173)...
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   ✓ Frontend Vite đã đang chạy trên Port 5173.
) else (
    echo   * Đang khởi động Frontend trong cửa sổ riêng biệt...
    start "EduLive Frontend (Vite React - Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
    set /a FE_WAIT=0
    :wait_fe
    netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
    if !errorlevel! neq 0 (
        set /a FE_WAIT+=1
        if !FE_WAIT! leq 15 (
            timeout /t 1 >nul
            goto wait_fe
        )
    )
    echo   ✓ Đã kích hoạt tiến trình Frontend Vite.
)

:: 4. Mở trình duyệt Web
echo.
echo [4/4] Mở trình duyệt trải nghiệm hệ thống EduLive...
timeout /t 1 >nul
start http://localhost:5173

echo.
echo ==============================================================================
echo   🎉 HỆ THỐNG EDULIVE ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG!
echo.
echo   - 🌐 Giao diện Người dùng : http://localhost:5173
echo   - ⚙️  Backend REST API     : http://localhost:8088
echo   - 📚 Swagger UI Docs      : http://localhost:8088/swagger-ui.html
echo.
echo   💡 Mẹo: Để dừng toàn bộ hệ thống sạch sẽ, hãy nhấp đúp vào file 'stop.bat'.
echo ==============================================================================
echo.
pause
