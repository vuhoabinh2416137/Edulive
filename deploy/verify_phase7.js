/**
 * Verification script for Phase 7: Real-time Notifications & Analytics Dashboard
 */
const http = require('http');

const BASE_URL = 'http://localhost:8088';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('=== BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 7: REAL-TIME NOTIFICATIONS & ANALYTICS DASHBOARD ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  try {
    // 1. Đăng nhập Giảng viên & Học viên
    console.log('1. Đăng nhập Giảng viên & Học viên:');
    const lecLogin = await request('POST', '/api/v1/auth/login', {
      email: 'giangvien1@edulive.vn',
      password: 'Password@123'
    });
    assert(lecLogin.status === 200 && lecLogin.body.accessToken, 'Giảng viên đăng nhập thành công');
    const lecToken = lecLogin.body.accessToken;

    const stuLogin = await request('POST', '/api/v1/auth/login', {
      email: 'hocvien1@edulive.vn',
      password: 'Password@123'
    });
    assert(stuLogin.status === 200 && stuLogin.body.accessToken, 'Học viên đăng nhập thành công');
    const stuToken = stuLogin.body.accessToken;

    // 2. Kiểm tra Dashboard Học viên
    console.log('\n2. Kiểm tra Dashboard Học viên (/api/v1/dashboard/student):');
    const stuDash = await request('GET', '/api/v1/dashboard/student', null, stuToken);
    assert(stuDash.status === 200, 'Lấy dữ liệu Dashboard Học viên thành công (HTTP 200)');
    assert(stuDash.body.enrolledCoursesCount !== undefined, `Số khóa học đã đăng ký: ${stuDash.body.enrolledCoursesCount}`);
    assert(stuDash.body.averageQuizScore !== undefined, `Điểm thi trắc nghiệm trung bình: ${stuDash.body.averageQuizScore}`);
    assert(Array.isArray(stuDash.body.recentCourses), 'Danh sách tiến độ khóa học gần đây hợp lệ');
    assert(Array.isArray(stuDash.body.recentQuizAttempts), 'Lịch sử bài thi trắc nghiệm gần đây hợp lệ');

    // 3. Kiểm tra Dashboard Giảng viên
    console.log('\n3. Kiểm tra Dashboard Giảng viên (/api/v1/dashboard/lecturer):');
    const lecDash = await request('GET', '/api/v1/dashboard/lecturer', null, lecToken);
    assert(lecDash.status === 200, 'Giảng viên lấy dữ liệu Dashboard thành công (HTTP 200)');
    assert(lecDash.body.totalCoursesCount !== undefined, `Tổng số khóa học quản lý: ${lecDash.body.totalCoursesCount}`);
    assert(lecDash.body.totalStudentsEnrolled !== undefined, `Tổng số học viên theo học: ${lecDash.body.totalStudentsEnrolled}`);
    assert(Array.isArray(lecDash.body.topCourses), 'Danh sách các khóa học hàng đầu hợp lệ');

    // 4. Kiểm tra phân quyền Dashboard Giảng viên (Học viên không có quyền truy cập)
    console.log('\n4. Kiểm tra phân quyền Dashboard (RBAC):');
    const stuTryLecDash = await request('GET', '/api/v1/dashboard/lecturer', null, stuToken);
    assert(stuTryLecDash.status === 403, 'Học viên bị chặn khi truy cập Dashboard Giảng viên (HTTP 403 Forbidden)');

    // 5. Kiểm tra Notification APIs
    console.log('\n5. Kiểm tra Notification APIs cho Học viên:');
    const notifsRes = await request('GET', '/api/v1/notifications', null, stuToken);
    assert(notifsRes.status === 200, 'Lấy danh sách thông báo thành công (HTTP 200)');
    assert(Array.isArray(notifsRes.body), 'Định dạng danh sách thông báo là Array');

    const unreadCountRes = await request('GET', '/api/v1/notifications/unread-count', null, stuToken);
    assert(unreadCountRes.status === 200, 'Lấy số lượng thông báo chưa đọc thành công');
    assert(typeof unreadCountRes.body.unreadCount === 'number', `Số lượng chưa đọc hiện tại: ${unreadCountRes.body.unreadCount}`);

    // Nếu có thông báo, kiểm tra mark single read
    if (notifsRes.body.length > 0) {
      const firstId = notifsRes.body[0].id;
      const markSingleRes = await request('PATCH', `/api/v1/notifications/${firstId}/read`, null, stuToken);
      assert(markSingleRes.status === 200 && markSingleRes.body.isRead === true, `Đánh dấu đã đọc thông báo #${firstId} thành công`);
    } else {
      console.log('  - Không có thông báo mẫu, bỏ qua kiểm tra mark single');
    }

    // Đánh dấu tất cả thông báo đã đọc
    console.log('\n6. Đánh dấu tất cả thông báo đã đọc:');
    const markAllRes = await request('PATCH', '/api/v1/notifications/read-all', null, stuToken);
    assert(markAllRes.status === 200, 'Đánh dấu tất cả đã đọc thành công (HTTP 200)');

    const countAfter = await request('GET', '/api/v1/notifications/unread-count', null, stuToken);
    assert(countAfter.body.unreadCount === 0, 'Số thông báo chưa đọc về 0 sau khi markAllAsRead');

    console.log(`\n=== KẾT QUẢ: ĐÃ VƯỢT QUA ${passed}/${total} TIÊU CHÍ GIAI ĐOẠN 7 ===\n`);
    if (passed === total) {
      console.log('>>> GIAI ĐOẠN 7 HOÀN THÀNH 100% XUẤT SẮC! <<<');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Lỗi ngoại lệ trong quá trình kiểm thử:', err);
    process.exit(1);
  }
}

run();
