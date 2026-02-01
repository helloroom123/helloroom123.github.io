@echo off
chcp 65001 >nul
echo ========================================
echo   RINNY DATE APK 重新打包工具
echo ========================================
echo.

REM 检查是否安装了 Java
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Java，请先安装 JDK
    echo 下载地址: https://adoptium.net/
    pause
    exit /b 1
)

REM 检查 apktool
if not exist "%~dp0tools\apktool.jar" (
    echo [提示] 请下载以下工具到 tools 文件夹:
    echo   1. apktool.jar - https://ibotpeaches.github.io/Apktool/
    echo   2. uber-apk-signer.jar - https://github.com/nicoboss/uber-apk-signer/releases
    echo.
    echo 然后重新运行此脚本
    pause
    exit /b 1
)

echo 步骤 1/3: 打包APK...
cd /d "%~dp0"
java -jar tools\apktool.jar b . -o output\rinny_modded_unsigned.apk

echo.
echo 步骤 2/3: 签名APK...
java -jar tools\uber-apk-signer.jar -a output\rinny_modded_unsigned.apk -o output

echo.
echo 步骤 3/3: 完成!
echo.
echo 修改后的APK位于: output 文件夹
echo 请将APK传输到手机安装
echo.
pause
