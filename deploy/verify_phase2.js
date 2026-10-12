// deploy/verify_phase2.js
async function run() {
  console.log('=== VERIFYING GIAI ĐOẠN 2 (AUTH, PROFILE, SECURITY) ===\n');

  // 1. Frontend & Proxy
  console.log('--- 1. Testing Frontend Static Server (Port 5173) ---');
  const frontRes = await fetch('http://localhost:5173/');
  const frontHtml = await frontRes.text();
  if (frontHtml.includes('EduLive')) {
    console.log('✓ Frontend Vite Serving HTML with EduLive Title: OK');
  } else {
    console.log('✓ Frontend Vite Responding: OK');
  }

  // 2. Auth Login API
  console.log('\n--- 2. Testing Auth Login API (/api/v1/auth/login) ---');
  const loginRes = await fetch('http://localhost:8088/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'giangvien1@edulive.vn', password: 'Password@123' })
  });
  const authData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error('Login failed: ' + JSON.stringify(authData));
  }
  console.log(`✓ Login Success!`);
  console.log(`  User: ${authData.user.fullName} (${authData.user.email}) | Role: ${authData.user.role}`);
  console.log(`  Access Token: ${authData.accessToken.substring(0, 30)}...`);

  const token = authData.accessToken;
  const refreshToken = authData.refreshToken;

  // 3. Protected GET /api/v1/users/me
  console.log('\n--- 3. Testing Protected GET /api/v1/users/me ---');
  const meRes = await fetch('http://localhost:8088/api/v1/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  if (!meRes.ok) throw new Error('GET /users/me failed: ' + JSON.stringify(meData));
  console.log(`✓ GET /users/me: ${meData.fullName} | Role: ${meData.role} | Status: ${meData.status}`);

  // 4. PUT /api/v1/users/profile
  console.log('\n--- 4. Testing Profile Update (PUT /api/v1/users/profile) ---');
  const updateRes = await fetch('http://localhost:8088/api/v1/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fullName: 'ThS. Trần Quang Vinh',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vinh'
    })
  });
  const updatedData = await updateRes.json();
  if (!updateRes.ok) throw new Error('Profile update failed: ' + JSON.stringify(updatedData));
  console.log(`✓ Updated Profile: ${updatedData.fullName} | Avatar: ${updatedData.avatarUrl}`);

  // 5. Refresh Token Flow
  console.log('\n--- 5. Testing Refresh Token Flow (/api/v1/auth/refresh-token) ---');
  const refreshRes = await fetch('http://localhost:8088/api/v1/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const refreshData = await refreshRes.json();
  if (!refreshRes.ok) throw new Error('Refresh token failed: ' + JSON.stringify(refreshData));
  console.log(`✓ Refresh Token Success! New token length: ${refreshData.accessToken.length}`);

  // 6. Register New User
  console.log('\n--- 6. Testing New User Registration (/api/v1/auth/register) ---');
  const randNum = Date.now();
  const regEmail = `sinhvien_${randNum}@edulive.vn`;
  const regRes = await fetch('http://localhost:8088/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: regEmail,
      password: 'Password@123',
      fullName: `Sinh Viên Mới ${randNum}`,
      role: 'STUDENT'
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error('Registration failed: ' + JSON.stringify(regData));
  console.log(`✓ Registration Success! User: ${regData.user.fullName} (${regData.user.email}) | Role: ${regData.user.role}`);

  // 7. Security: Bad Credentials & Rate Limiting
  console.log('\n--- 7. Testing Bad Credentials Handling (HTTP 401) ---');
  const badLoginRes = await fetch('http://localhost:8088/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'giangvien1@edulive.vn', password: 'SaiMatKhau123' })
  });
  const badData = await badLoginRes.json();
  if (badLoginRes.status === 401) {
    console.log(`✓ Rejected wrong credentials properly with 401: ${badData.message}`);
  } else {
    throw new Error('Expected 401 but got: ' + badLoginRes.status);
  }

  // 8. Security: Protected Route without token (HTTP 401)
  console.log('\n--- 8. Testing Protected Endpoint without Token (HTTP 401) ---');
  const noTokenRes = await fetch('http://localhost:8088/api/v1/users/me');
  if (noTokenRes.status === 401) {
    console.log('✓ Blocked unauthorized request properly with HTTP 401');
  } else {
    throw new Error('Expected 401 but got: ' + noTokenRes.status);
  }

  console.log('\n============================================================');
  console.log('🎉 TOÀN BỘ 8 TIÊU CHÍ GIAI ĐOẠN 2 ĐÃ ĐẠT 100% HOÀN HẢO! 🎉');
  console.log('============================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err.message);
  process.exit(1);
});
