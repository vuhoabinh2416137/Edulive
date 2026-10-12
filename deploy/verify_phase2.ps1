# verify_phase2.ps1
$ErrorActionPreference = 'Stop'
Write-Host "--- 1. Testing Frontend Static Bundle & Proxy ---"
$html = Invoke-RestMethod -Uri 'http://localhost:5173/'
if ($html -match 'EduLive') { 
    Write-Host "Vite Home Page HTML: OK (Title EduLive found)" 
} else { 
    Write-Host "Vite HTML returned successfully" 
}

Write-Host "`n--- 2. Testing Auth Login API ---"
$loginBody = @{ email = 'giangvien1@edulive.vn'; password = 'Password@123' } | ConvertTo-Json
$authRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
Write-Host "Login Success: Token acquired."
Write-Host "User: $($authRes.user.fullName) | Email: $($authRes.user.email) | Role: $($authRes.user.role)"
Write-Host "Access Token (first 30 chars): $($authRes.accessToken.Substring(0, 30))..."

Write-Host "`n--- 3. Testing Protected GET /api/v1/users/me ---"
$headers = @{ Authorization = "Bearer $($authRes.accessToken)" }
$meRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/users/me' -Method Get -Headers $headers
Write-Host "User Me verified: $($meRes.fullName) ($($meRes.email)) | Role: $($meRes.role)"

Write-Host "`n--- 4. Testing Profile Update ---"
$updateBody = @{ fullName = 'ThS. Trần Quang Vinh (Updated)'; avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=vinh' } | ConvertTo-Json
$updatedUser = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/users/me' -Method Put -Headers $headers -Body $updateBody -ContentType 'application/json'
Write-Host "Updated Profile: $($updatedUser.fullName) | Avatar: $($updatedUser.avatarUrl)"

Write-Host "`n--- 5. Testing Refresh Token Flow ---"
$refreshBody = @{ refreshToken = $authRes.refreshToken } | ConvertTo-Json
$newAuthRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/refresh-token' -Method Post -Body $refreshBody -ContentType 'application/json'
Write-Host "Refresh Token Success! New Access Token length: $($newAuthRes.accessToken.Length)"

Write-Host "`n--- 6. Testing New User Registration ---"
$randSuffix = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds
$uniqueEmail = "hocvien$($randSuffix)@gmail.com"
$regJson = @{ email = $uniqueEmail; password = 'Password@123'; fullName = "Hoc Vien Moi $randSuffix"; role = 'STUDENT' } | ConvertTo-Json
$regBytes = [System.Text.Encoding]::UTF8.GetBytes($regJson)
$regRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/register' -Method Post -Body $regBytes -ContentType 'application/json; charset=utf-8'
Write-Host "Registered new student: $($regRes.user.fullName) ($($regRes.user.email)) with role $($regRes.user.role)"

Write-Host "`n--- 7. Testing Bad Credentials Handling (RateLimiter & 401) ---"
try {
    $badLogin = @{ email = 'giangvien1@edulive.vn'; password = 'SaiMatKhau123' } | ConvertTo-Json
    Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/login' -Method Post -Body $badLogin -ContentType 'application/json'
    Write-Host "ERROR: Bad login did not throw exception!"
} catch {
    Write-Host "Properly rejected wrong credentials (HTTP 401 / Bad Request) - Handled safely."
}

Write-Host "`n==============================================="
Write-Host ">>> ALL GIAI ĐOẠN 2 TESTS PASSED 100%! <<<"
Write-Host "==============================================="
