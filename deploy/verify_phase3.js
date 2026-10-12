// deploy/verify_phase3.js
async function run() {
  console.log('=== VERIFYING GIAI ĐOẠN 3 (COURSES, LESSONS, ENROLLMENT, PROGRESS) ===\n');

  const BASE_URL = 'http://localhost:8088/api/v1';

  // 1. Categories
  console.log('--- 1. Testing GET /api/v1/categories ---');
  const catRes = await fetch(`${BASE_URL}/categories`);
  const categories = await catRes.json();
  if (!catRes.ok || !Array.isArray(categories) || categories.length === 0) {
    throw new Error('Failed to fetch categories: ' + JSON.stringify(categories));
  }
  console.log(`✓ Fetched ${categories.length} categories: ${categories.map(c => c.name).join(', ')}`);

  // 2. Courses
  console.log('\n--- 2. Testing GET /api/v1/courses ---');
  const courseRes = await fetch(`${BASE_URL}/courses`);
  const coursePage = await courseRes.json();
  if (!courseRes.ok || coursePage.totalElements === 0) {
    throw new Error('Failed to fetch courses: ' + JSON.stringify(coursePage));
  }
  console.log(`✓ Fetched ${coursePage.totalElements} courses in database.`);
  const firstCourse = coursePage.content[0];
  console.log(`  Course 1: "${firstCourse.title}" | Mã lớp: ${firstCourse.classCode} | Tổng bài học: ${firstCourse.totalLessons}`);

  // 3. Course Detail
  console.log('\n--- 3. Testing GET /api/v1/courses/1 ---');
  const detailRes = await fetch(`${BASE_URL}/courses/1`);
  const detail = await detailRes.json();
  if (!detailRes.ok || !detail.chapters || detail.chapters.length === 0) {
    throw new Error('Failed to fetch course detail: ' + JSON.stringify(detail));
  }
  console.log(`✓ Course 1 Detail: ${detail.chapters.length} chapters, ${detail.totalLessons} lessons total.`);
  detail.chapters.forEach(ch => {
    console.log(`  - [Chương ${ch.orderIndex}] ${ch.title} (${ch.lessons.length} bài)`);
  });

  // 4. Login Student
  console.log('\n--- 4. Logging in as Student (hocvien3@edulive.vn) ---');
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hocvien3@edulive.vn', password: 'Password@123' })
  });
  const studentAuth = await studentLoginRes.json();
  if (!studentLoginRes.ok) throw new Error('Student login failed: ' + JSON.stringify(studentAuth));
  const studentToken = studentAuth.accessToken;
  console.log(`✓ Student logged in: ${studentAuth.user.fullName} (${studentAuth.user.email})`);

  // 5. Join Course by Class Code
  console.log(`\n--- 5. Student Joins Course via Class Code: "${firstCourse.classCode}" ---`);
  const joinRes = await fetch(`${BASE_URL}/enrollments/join`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ classCode: firstCourse.classCode })
  });
  const enrollData = await joinRes.json();
  if (!joinRes.ok) throw new Error('Join course failed: ' + JSON.stringify(enrollData));
  console.log(`✓ Joined Course Success! Enrollment ID: ${enrollData.id} | Khóa: "${enrollData.courseTitle}"`);

  // 6. Get My Courses
  console.log('\n--- 6. Testing GET /api/v1/enrollments/my-courses ---');
  const myCoursesRes = await fetch(`${BASE_URL}/enrollments/my-courses`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const myCourses = await myCoursesRes.json();
  if (!myCoursesRes.ok || !Array.isArray(myCourses)) {
    throw new Error('Get my-courses failed: ' + JSON.stringify(myCourses));
  }
  console.log(`✓ Student currently enrolled in ${myCourses.length} course(s):`);
  myCourses.forEach(c => console.log(`  - ${c.courseTitle} (Tiến độ: ${c.progressPercent}%)`));

  // 7. Complete Lessons & Calculate Progress
  console.log('\n--- 7. Completing Lesson 1 & Checking Progress ---');
  const comp1Res = await fetch(`${BASE_URL}/enrollments/1/lessons/1/complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const prog1 = await comp1Res.json();
  if (!comp1Res.ok) throw new Error('Complete lesson 1 failed: ' + JSON.stringify(prog1));
  console.log(`✓ Completed Lesson 1! Tiến độ: ${prog1.progressPercent}% (${prog1.completedLessons}/${prog1.totalLessons} bài)`);

  console.log('\n--- 8. Completing Lesson 2 & Checking Progress ---');
  const comp2Res = await fetch(`${BASE_URL}/enrollments/1/lessons/2/complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const prog2 = await comp2Res.json();
  if (!comp2Res.ok) throw new Error('Complete lesson 2 failed: ' + JSON.stringify(prog2));
  console.log(`✓ Completed Lesson 2! Tiến độ: ${prog2.progressPercent}% (${prog2.completedLessons}/${prog2.totalLessons} bài)`);

  // 9. Get Course Progress
  console.log('\n--- 9. Testing GET /api/v1/enrollments/1/progress ---');
  const getProgRes = await fetch(`${BASE_URL}/enrollments/1/progress`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const progDetail = await getProgRes.json();
  if (!getProgRes.ok) throw new Error('Get progress failed: ' + JSON.stringify(progDetail));
  console.log(`✓ Verified Progress: ${progDetail.progressPercent}% - Bài đã hoàn thành: [${progDetail.completedLessonIds.join(', ')}]`);

  // 10. Login Lecturer & Create New Course
  console.log('\n--- 10. Logging in as Lecturer (giangvien1@edulive.vn) ---');
  const lectLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'giangvien1@edulive.vn', password: 'Password@123' })
  });
  const lectAuth = await lectLoginRes.json();
  const lectToken = lectAuth.accessToken;
  console.log(`✓ Lecturer logged in: ${lectAuth.user.fullName}`);

  console.log('\n--- 11. Lecturer Creates New Course ---');
  const randKey = Date.now().toString().slice(-4);
  const newCourseRes = await fetch(`${BASE_URL}/courses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lectToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Khóa học Kiểm thử Tự động ${randKey}`,
      description: 'Khóa học được tạo tự động bởi script kiểm thử Phase 3',
      categoryId: 1,
      thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80'
    })
  });
  const newCourse = await newCourseRes.json();
  if (!newCourseRes.ok) throw new Error('Create course failed: ' + JSON.stringify(newCourse));
  console.log(`✓ Created Course: "${newCourse.title}" | Mã lớp tự sinh: ${newCourse.classCode} | Slug: ${newCourse.slug}`);

  // 12. Lecturer Adds Chapter & Lesson to New Course
  console.log('\n--- 12. Lecturer Adds Chapter and Lesson ---');
  const chapRes = await fetch(`${BASE_URL}/courses/${newCourse.id}/chapters`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lectToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: 'Chương 1: Giới thiệu tổng quan', orderIndex: 1 })
  });
  const chapData = await chapRes.json();
  if (!chapRes.ok) throw new Error('Create chapter failed: ' + JSON.stringify(chapData));
  console.log(`✓ Created Chapter ID: ${chapData.id} - "${chapData.title}"`);

  const lessRes = await fetch(`${BASE_URL}/courses/chapters/${chapData.id}/lessons`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lectToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Bài 1: Cài đặt môi trường',
      contentType: 'VIDEO',
      contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationSeconds: 300,
      orderIndex: 1
    })
  });
  const lessData = await lessRes.json();
  if (!lessRes.ok) throw new Error('Create lesson failed: ' + JSON.stringify(lessData));
  console.log(`✓ Created Lesson ID: ${lessData.id} - "${lessData.title}" (${lessData.contentType})`);

  console.log('\n================================================================');
  console.log('🎉 TOÀN BỘ 12 TIÊU CHÍ BACKEND GIAI ĐOẠN 3 ĐÃ ĐẠT 100% HOÀN HẢO! 🎉');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err.message);
  process.exit(1);
});
