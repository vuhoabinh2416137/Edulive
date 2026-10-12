// deploy/verify_phase4.js
async function run() {
  console.log('=== VERIFYING GIAI ĐOẠN 4 (QUIZ, QUESTIONS, AUTO-GRADING, STATS, CSV) ===\n');

  const BASE_URL = 'http://localhost:8088/api/v1';

  // Helper auth header
  const authHeader = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // 1. Get Quizzes by Course
  console.log('--- 1. Testing GET /api/v1/courses/1/quizzes ---');
  const quizListRes = await fetch(`${BASE_URL}/courses/1/quizzes`);
  const quizzes = await quizListRes.json();
  if (!quizListRes.ok || !Array.isArray(quizzes) || quizzes.length === 0) {
    throw new Error('Failed to fetch quizzes: ' + JSON.stringify(quizzes));
  }
  console.log(`✓ Fetched ${quizzes.length} quiz(zes) for Course 1.`);
  console.log(`  Quiz 1: "${quizzes[0].title}" | ${quizzes[0].questionCount} câu hỏi | Thời gian: ${quizzes[0].timeLimitMinutes} phút | Điểm đạt: ${quizzes[0].passingScore}`);

  // 2. Login Lecturer (giangvien1@edulive.vn)
  console.log('\n--- 2. Logging in as Lecturer (giangvien1@edulive.vn) ---');
  const lecLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'giangvien1@edulive.vn', password: 'Password@123' })
  });
  const lecAuth = await lecLoginRes.json();
  if (!lecLoginRes.ok) throw new Error('Lecturer login failed: ' + JSON.stringify(lecAuth));
  const lecToken = lecAuth.accessToken;
  console.log(`✓ Lecturer logged in: ${lecAuth.user.fullName} (Role: ${lecAuth.user.role})`);

  // 3. Lecturer Creates a New Comprehensive Quiz
  console.log('\n--- 3. Lecturer Creates a New Quiz with 3 Types of Questions ---');
  const newQuizPayload = {
    courseId: 1,
    title: 'Kiểm tra tổng hợp: Đánh giá Năng lực Full-stack Đợt 1',
    description: 'Đề thi trắc nghiệm gồm Single Choice, Multiple Choice và True/False có giải thích chi tiết.',
    timeLimitMinutes: 20,
    maxAttempts: 3,
    passingScore: 60.0,
    questions: [
      {
        questionText: 'Trong kiến trúc Spring Boot, Annotation nào dùng để đánh dấu một lớp là REST Controller trả về JSON?',
        questionType: 'SINGLE_CHOICE',
        points: 2.0,
        explanation: '@RestController kết hợp @Controller và @ResponseBody để tự động serialize đối tượng thành JSON.',
        orderIndex: 1,
        options: [
          { optionText: '@RestController', isCorrect: true, orderIndex: 1 },
          { optionText: '@Service', isCorrect: false, orderIndex: 2 },
          { optionText: '@Repository', isCorrect: false, orderIndex: 3 },
          { optionText: '@Component', isCorrect: false, orderIndex: 4 }
        ]
      },
      {
        questionText: 'Những phát biểu nào sau đây là ĐÚNG về kiến trúc WebRTC? (Chọn tất cả các đáp án đúng)',
        questionType: 'MULTIPLE_CHOICE',
        points: 2.0,
        explanation: 'WebRTC truyền media P2P qua UDP (SRTP) và cần máy chủ Signaling (như WebSocket) để trao đổi SDP.',
        orderIndex: 2,
        options: [
          { optionText: 'Media stream âm thanh/video truyền trực tiếp P2P giữa các browser', isCorrect: true, orderIndex: 1 },
          { optionText: 'Cần máy chủ Signaling để trao đổi SDP Offer và SDP Answer', isCorrect: true, orderIndex: 2 },
          { optionText: 'WebRTC bắt buộc phải qua server trung gian để giải mã toàn bộ video', isCorrect: false, orderIndex: 3 },
          { optionText: 'Sử dụng giao thức SRTP để mã hóa end-to-end dữ liệu truyền', isCorrect: true, orderIndex: 4 }
        ]
      },
      {
        questionText: 'Cơ sở dữ liệu PostgreSQL có hỗ trợ kiểu dữ liệu JSONB với khả năng đánh index GIN không?',
        questionType: 'TRUE_FALSE',
        points: 1.0,
        explanation: 'PostgreSQL hỗ trợ kiểu JSONB lưu trữ nhị phân và có thể đánh index GIN để tăng tốc độ truy vấn vượt trội.',
        orderIndex: 3,
        options: [
          { optionText: 'Đúng', isCorrect: true, orderIndex: 1 },
          { optionText: 'Sai', isCorrect: false, orderIndex: 2 }
        ]
      }
    ]
  };

  const createQuizRes = await fetch(`${BASE_URL}/courses/1/quizzes`, {
    method: 'POST',
    headers: authHeader(lecToken),
    body: JSON.stringify(newQuizPayload)
  });
  const createdQuiz = await createQuizRes.json();
  if (!createQuizRes.ok) throw new Error('Create quiz failed: ' + JSON.stringify(createdQuiz));
  console.log(`✓ Created new Quiz ID: ${createdQuiz.id} | Tiêu đề: "${createdQuiz.title}"`);
  console.log(`  Tổng số câu hỏi: ${createdQuiz.questions.length} câu | Tổng điểm: ${createdQuiz.totalPoints}đ`);

  const q1 = createdQuiz.questions[0];
  const q2 = createdQuiz.questions[1];
  const q3 = createdQuiz.questions[2];

  // 4. Login Student (hocvien1@edulive.vn)
  console.log('\n--- 4. Logging in as Student (hocvien1@edulive.vn) ---');
  const stuLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hocvien1@edulive.vn', password: 'Password@123' })
  });
  const stuAuth = await stuLoginRes.json();
  if (!stuLoginRes.ok) throw new Error('Student login failed: ' + JSON.stringify(stuAuth));
  const stuToken = stuAuth.accessToken;
  console.log(`✓ Student logged in: ${stuAuth.user.fullName} (${stuAuth.user.email})`);

  // Ensure Student is enrolled in Course 1
  await fetch(`${BASE_URL}/enrollments/join`, {
    method: 'POST',
    headers: authHeader(stuToken),
    body: JSON.stringify({ courseId: 1 })
  });

  // 5. Student Starts Quiz (POST /api/v1/quizzes/{id}/start)
  console.log(`\n--- 5. Student Starts Quiz ID ${createdQuiz.id} (Check Answer Concealment) ---`);
  const startQuizRes = await fetch(`${BASE_URL}/quizzes/${createdQuiz.id}/start`, {
    method: 'POST',
    headers: authHeader(stuToken)
  });
  const takingData = await startQuizRes.json();
  if (!startQuizRes.ok) throw new Error('Start quiz failed: ' + JSON.stringify(takingData));
  console.log(`✓ Quiz started successfully! Attempt ID: ${takingData.attemptId}`);
  console.log(`  Thời gian bắt đầu: ${takingData.startedAt} | Hạn chót: ${takingData.expiresAt}`);

  // CRITICAL SECURITY CHECK: Ensure 'isCorrect' and 'explanation' are completely absent
  let leakFound = false;
  takingData.questions.forEach(q => {
    if (q.explanation) leakFound = true;
    q.options.forEach(opt => {
      if (opt.isCorrect !== undefined && opt.isCorrect !== null) leakFound = true;
    });
  });
  if (leakFound) {
    throw new Error('SECURITY VIOLATION: Correct answers or explanation were leaked during quiz taking!');
  }
  console.log('✓ BẢO MẬT TUYỆT ĐỐI: Đáp án đúng và lời giải thích đã được ẩn hoàn toàn khỏi thí sinh.');

  // 6. Student Submits Quiz with Answers
  console.log('\n--- 6. Student Submits Quiz (Auto-Grading Verification) ---');
  // Find correct options from createdQuiz (as known by lecturer):
  // Q1: Option 1 (RestController) -> Correct
  const q1CorrectOpt = q1.options.find(o => o.isCorrect).id;
  // Q2: Options 1, 2, 4 -> Student selects 1, 2 (Misses 4) -> Incorrect
  const q2Selected = [q2.options[0].id, q2.options[1].id];
  // Q3: Option 1 (Đúng) -> Correct
  const q3CorrectOpt = q3.options.find(o => o.isCorrect).id;

  const submitPayload = {
    answers: [
      { questionId: q1.id, selectedOptionIds: [q1CorrectOpt] },
      { questionId: q2.id, selectedOptionIds: q2Selected },
      { questionId: q3.id, selectedOptionIds: [q3CorrectOpt] }
    ]
  };

  const submitRes = await fetch(`${BASE_URL}/quizzes/attempts/${takingData.attemptId}/submit`, {
    method: 'POST',
    headers: authHeader(stuToken),
    body: JSON.stringify(submitPayload)
  });
  const result = await submitRes.json();
  if (!submitRes.ok) throw new Error('Submit quiz failed: ' + JSON.stringify(result));

  console.log(`✓ Chấm điểm hoàn tất: Điểm số = ${result.score}/100 | Trạng thái: ${result.isPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`);
  console.log(`  Số câu đúng: ${result.correctQuestionsCount} / ${result.totalQuestions} câu`);
  console.log(`  Điểm số đạt được: ${result.earnedPoints} / ${result.totalPoints}đ`);

  // Expected: Q1 (2đ) + Q3 (1đ) = 3đ out of 5đ => (3/5) * 100 = 60.0% => isPassed = true (passingScore is 60.0)
  if (Number(result.score) !== 60.0) {
    throw new Error(`Grading calculation mismatch! Expected 60.0, got ${result.score}`);
  }
  if (!result.isPassed) {
    throw new Error('Result passing status mismatch! Expected isPassed = true');
  }
  console.log('✓ Logic chấm điểm tự động (Auto-Grading) khớp chính xác 100% với kỳ vọng!');

  // 7. Student Views Result and Explanations
  console.log(`\n--- 7. Testing GET /api/v1/quizzes/attempts/${takingData.attemptId}/result ---`);
  const viewResultRes = await fetch(`${BASE_URL}/quizzes/attempts/${takingData.attemptId}/result`, {
    headers: authHeader(stuToken)
  });
  const viewResult = await viewResultRes.json();
  if (!viewResultRes.ok) throw new Error('Get result failed: ' + JSON.stringify(viewResult));
  console.log(`✓ Loaded attempt review. Review questions count: ${viewResult.reviewQuestions.length}`);
  viewResult.reviewQuestions.forEach((rq, idx) => {
    console.log(`  - Câu ${idx + 1}: ${rq.isCorrect ? '✓ ĐÚNG' : '✗ SAI'} (${rq.earnedPoints}/${rq.points}đ) | Giải thích: "${rq.explanation}"`);
  });

  // 8. Lecturer Views Quiz Statistics
  console.log(`\n--- 8. Lecturer Views Statistics (GET /api/v1/quizzes/${createdQuiz.id}/statistics) ---`);
  const statsRes = await fetch(`${BASE_URL}/quizzes/${createdQuiz.id}/statistics`, {
    headers: authHeader(lecToken)
  });
  const stats = await statsRes.json();
  if (!statsRes.ok) throw new Error('Get statistics failed: ' + JSON.stringify(stats));
  console.log(`✓ Quiz Statistics: ${stats.totalAttempts} bài nộp | Thí sinh: ${stats.uniqueParticipants}`);
  console.log(`  Điểm TB: ${stats.averageScore} | Điểm cao nhất: ${stats.highestScore} | Tỷ lệ đạt: ${stats.passRatePercent}%`);

  // 9. Lecturer Exports CSV
  console.log(`\n--- 9. Lecturer Exports CSV (GET /api/v1/quizzes/${createdQuiz.id}/export-csv) ---`);
  const csvRes = await fetch(`${BASE_URL}/quizzes/${createdQuiz.id}/export-csv`, {
    headers: authHeader(lecToken)
  });
  const csvText = await csvRes.text();
  if (!csvRes.ok) throw new Error('Export CSV failed: ' + csvText);
  if (!csvText.includes('BÁO CÁO KẾT QUẢ BÀI THI') || !csvText.includes('hocvien1@edulive.vn')) {
    throw new Error('Exported CSV content is invalid: ' + csvText);
  }
  console.log(`✓ CSV exported successfully (${csvText.length} bytes). Preview header:`);
  console.log(csvText.split('\n').slice(0, 7).join('\n'));

  // 10. Security: Student Forbidden from Accessing Statistics
  console.log('\n--- 10. Security RBAC Check: Student accessing Lecturer Statistics ---');
  const forbiddenRes = await fetch(`${BASE_URL}/quizzes/${createdQuiz.id}/statistics`, {
    headers: authHeader(stuToken)
  });
  if (forbiddenRes.status === 403) {
    console.log('✓ BẢO MẬT RBAC CHUẨN: Học viên bị chặn (403 Forbidden) khi cố xem thống kê giảng viên.');
  } else {
    throw new Error(`Expected 403 Forbidden, but got status ${forbiddenRes.status}`);
  }

  console.log('\n===============================================================');
  console.log('🎉 TẤT CẢ 10/10 TIÊU CHÍ GIAI ĐOẠN 4 ĐÃ ĐẠT 100% HOÀN HẢO! 🎉');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
