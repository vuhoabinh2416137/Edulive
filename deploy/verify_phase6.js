/**
 * Verification script for Phase 6: WebRTC Mesh Video Call & Live Classroom
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
  console.log('=== BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 6: WEBRTC VIDEO CALL & PHÒNG HỌC TRỰC TUYẾN ===\n');
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
    // 1. Kiểm tra API ICE Servers
    console.log('1. Kiểm tra API ICE Servers:');
    const iceRes = await request('GET', '/api/v1/video-rooms/ice-servers');
    assert(iceRes.status === 200, 'Lấy danh sách ICE servers thành công (HTTP 200)');
    assert(Array.isArray(iceRes.body) && iceRes.body.length > 0, 'Có ít nhất 1 STUN/TURN server được cấu hình');
    const hasGoogleStun = Array.isArray(iceRes.body[0].urls)
      ? iceRes.body[0].urls.some(u => u.includes('stun:stun.l.google.com'))
      : String(iceRes.body[0].urls).includes('stun:stun.l.google.com');
    assert(hasGoogleStun, 'Cấu hình Google STUN miễn phí chính xác');

    // 2. Đăng nhập Giảng viên
    console.log('\n2. Đăng nhập Giảng viên:');
    const lectLogin = await request('POST', '/api/v1/auth/login', {
      email: 'giangvien1@edulive.vn',
      password: 'Password@123'
    });
    assert(lectLogin.status === 200 && lectLogin.body.accessToken, 'Giảng viên đăng nhập thành công');
    const lectToken = lectLogin.body.accessToken;

    // 3. Đăng nhập Học viên
    console.log('\n3. Đăng nhập Học viên:');
    const stuLogin = await request('POST', '/api/v1/auth/login', {
      email: 'hocvien1@edulive.vn',
      password: 'Password@123'
    });
    assert(stuLogin.status === 200 && stuLogin.body.accessToken, 'Học viên đăng nhập thành công');
    const stuToken = stuLogin.body.accessToken;

    // 4. Giảng viên tạo phòng học trực tuyến mới
    console.log('\n4. Giảng viên tạo phòng học trực tuyến mới:');
    const createRoomRes = await request('POST', '/api/v1/video-rooms', {
      courseId: 1,
      title: 'Lớp học WebRTC Test Thực chiến'
    }, lectToken);
    assert(createRoomRes.status === 201, 'Giảng viên tạo phòng học thành công (HTTP 201)');
    assert(createRoomRes.body.roomCode && createRoomRes.body.roomCode.length > 0, `Mã phòng ngẫu nhiên được sinh: ${createRoomRes.body.roomCode}`);
    assert(createRoomRes.body.isLive === true, 'Trạng thái phòng học đang mở (isLive = true)');
    const roomCode = createRoomRes.body.roomCode;

    // 5. Học viên không có quyền LECTURER không thể tạo phòng
    console.log('\n5. Kiểm tra phân quyền tạo phòng (RBAC):');
    const studentCreate = await request('POST', '/api/v1/video-rooms', {
      courseId: 1,
      title: 'Học viên thử tạo phòng trái phép'
    }, stuToken);
    assert(studentCreate.status === 403, 'Học viên bị chặn khi cố tạo phòng (HTTP 403 Forbidden)');

    // 6. Lấy thông tin phòng học theo mã phòng
    console.log('\n6. Lấy thông tin chi tiết phòng học:');
    const getRoomRes = await request('GET', `/api/v1/video-rooms/${roomCode}`, null, stuToken);
    assert(getRoomRes.status === 200, 'Lấy thông tin phòng học thành công (HTTP 200)');
    assert(getRoomRes.body.title === 'Lớp học WebRTC Test Thực chiến', 'Tiêu đề phòng học chính xác');
    assert(getRoomRes.body.hostId !== undefined, 'Thông tin giảng viên chủ trì đầy đủ');

    // 7. Lấy danh sách các phòng học của khóa học
    console.log('\n7. Lấy danh sách phòng học của khóa học:');
    const courseRoomsRes = await request('GET', `/api/v1/courses/1/video-rooms`, null, stuToken);
    assert(courseRoomsRes.status === 200, 'Lấy danh sách phòng theo khóa học thành công');
    assert(Array.isArray(courseRoomsRes.body) && courseRoomsRes.body.some(r => r.roomCode === roomCode), 'Phòng mới tạo xuất hiện trong danh sách khóa học');

    // 8. Đóng phòng học trực tuyến
    console.log('\n8. Giảng viên kết thúc/đóng phòng học:');
    const closeRes = await request('PUT', `/api/v1/video-rooms/${roomCode}/close`, null, lectToken);
    assert(closeRes.status === 204, 'Giảng viên đóng phòng học thành công (HTTP 204 No Content)');

    // 9. Kiểm tra lại trạng thái phòng sau khi đóng
    console.log('\n9. Kiểm tra trạng thái phòng sau khi đóng:');
    const getClosedRoomRes = await request('GET', `/api/v1/video-rooms/${roomCode}`, null, stuToken);
    assert(getClosedRoomRes.status === 200, 'Lấy phòng sau khi đóng thành công');
    assert(getClosedRoomRes.body.isLive === false, 'Phòng học đã được cập nhật trạng thái isLive = false');

    console.log(`\n=== KẾT QUẢ: ĐÃ VƯỢT QUA ${passed}/${total} TIÊU CHÍ GIAI ĐOẠN 6 ===\n`);
    if (passed === total) {
      console.log('>>> GIAI ĐOẠN 6 HOÀN THÀNH 100% XUẤT SẮC! <<<');
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
