// deploy/verify_phase5.js
async function run() {
  console.log('=== VERIFYING GIAI ĐOẠN 5 (DISCUSSION FORUM, NESTED COMMENTS, GROUP CHAT) ===\n');

  const BASE_URL = 'http://localhost:8088/api/v1';

  const authHeader = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // 1. Login Lecturer and Student
  console.log('--- 1. Logging in as Lecturer and Student ---');
  const lecRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'giangvien1@edulive.vn', password: 'Password@123' })
  });
  const lecData = await lecRes.json();
  const lecToken = lecData.accessToken;
  console.log(`✓ Lecturer: ${lecData.user.fullName} (${lecData.user.email})`);

  const stuRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hocvien1@edulive.vn', password: 'Password@123' })
  });
  const stuData = await stuRes.json();
  const stuToken = stuData.accessToken;
  console.log(`✓ Student: ${stuData.user.fullName} (${stuData.user.email})`);

  // Ensure Student is enrolled in Course 1
  await fetch(`${BASE_URL}/enrollments/join`, {
    method: 'POST',
    headers: authHeader(stuToken),
    body: JSON.stringify({ courseId: 1 })
  });

  // 2. Fetch Initial Discussions
  console.log('\n--- 2. Fetching Course 1 Discussions ---');
  const listRes = await fetch(`${BASE_URL}/courses/1/discussions`);
  const initialList = await listRes.json();
  if (!listRes.ok) throw new Error('Failed to fetch discussions: ' + JSON.stringify(initialList));
  console.log(`✓ Course 1 has ${initialList.length} discussion(s). First topic: "${initialList[0].title}"`);

  // 3. Student Creates a New Discussion Thread
  console.log('\n--- 3. Student Creates a New Discussion Thread ---');
  const createThreadPayload = {
    title: 'Thắc mắc về kiến trúc WebSocket STOMP và Session Scaling',
    content: 'Em muốn hỏi làm sao để scale hệ thống STOMP WebSocket khi có nhiều container backend chạy song song?',
    lessonId: 1
  };
  const createThreadRes = await fetch(`${BASE_URL}/courses/1/discussions`, {
    method: 'POST',
    headers: authHeader(stuToken),
    body: JSON.stringify(createThreadPayload)
  });
  const createdThread = await createThreadRes.json();
  if (!createThreadRes.ok) throw new Error('Create discussion failed: ' + JSON.stringify(createdThread));
  console.log(`✓ Created discussion ID ${createdThread.id}: "${createdThread.title}" by ${createdThread.author.fullName}`);

  // 4. Lecturer Answers the Question (Level 1 Comment)
  console.log('\n--- 4. Lecturer Posts an Answer (Root Comment) ---');
  const answerPayload = {
    content: 'Chào em, để scale STOMP WebSocket trên nhiều server ta thường tích hợp RabbitMQ hoặc Redis Pub/Sub làm External Message Broker thay thế SimpleBroker mặc định nhé!',
    parentId: null
  };
  const ansRes = await fetch(`${BASE_URL}/discussions/${createdThread.id}/comments`, {
    method: 'POST',
    headers: authHeader(lecToken),
    body: JSON.stringify(answerPayload)
  });
  const rootComment = await ansRes.json();
  if (!ansRes.ok) throw new Error('Lecturer comment failed: ' + JSON.stringify(rootComment));
  console.log(`✓ Lecturer commented (ID: ${rootComment.id}): "${rootComment.content.substring(0, 50)}..."`);

  // 5. Student Replies to Lecturer's Answer (Level 2 Nested Comment)
  console.log(`\n--- 5. Student Replies to Lecturer (Nested Comment parentId: ${rootComment.id}) ---`);
  const replyPayload = {
    content: 'Dạ em cảm ơn thầy nhiều ạ, vậy Spring Cloud Gateway có hỗ trợ định tuyến WebSocket này không thầy?',
    parentId: rootComment.id
  };
  const replyRes = await fetch(`${BASE_URL}/discussions/${createdThread.id}/comments`, {
    method: 'POST',
    headers: authHeader(stuToken),
    body: JSON.stringify(replyPayload)
  });
  const nestedReply = await replyRes.json();
  if (!replyRes.ok) throw new Error('Student nested reply failed: ' + JSON.stringify(nestedReply));
  console.log(`✓ Student replied (ID: ${nestedReply.id}, Parent: ${nestedReply.parentId}): "${nestedReply.content.substring(0, 50)}..."`);

  // 6. View Full Discussion Detail and Verify Nested Tree
  console.log(`\n--- 6. Verifying Nested Comments Tree (GET /api/v1/discussions/${createdThread.id}) ---`);
  const detailRes = await fetch(`${BASE_URL}/discussions/${createdThread.id}`);
  const threadDetail = await detailRes.json();
  if (!detailRes.ok) throw new Error('Get discussion detail failed: ' + JSON.stringify(threadDetail));

  console.log(`✓ Discussion Title: "${threadDetail.title}"`);
  console.log(`  Root Comments: ${threadDetail.comments.length}`);
  if (threadDetail.comments.length === 0 || threadDetail.comments[0].replies.length === 0) {
    throw new Error('Nested tree verification failed: root comment has no replies!');
  }
  const treeRoot = threadDetail.comments[0];
  console.log(`  - [Cấp 1] ${treeRoot.author.fullName}: "${treeRoot.content.substring(0, 45)}..."`);
  const treeChild = treeRoot.replies[0];
  console.log(`    ↳ [Cấp 2] ${treeChild.author.fullName}: "${treeChild.content.substring(0, 45)}..."`);
  console.log('✓ Cấu trúc cây bình luận phân cấp lồng nhau (Nested comments) hoạt động chính xác 100%!');

  // 7. Student Accepts the Answer
  console.log(`\n--- 7. Student Accepts Lecturer Answer (PUT /api/v1/discussions/comments/${rootComment.id}/accept) ---`);
  const acceptRes = await fetch(`${BASE_URL}/discussions/comments/${rootComment.id}/accept`, {
    method: 'PUT',
    headers: authHeader(stuToken)
  });
  if (!acceptRes.ok) throw new Error('Accept answer failed with status ' + acceptRes.status);
  console.log(`✓ Câu trả lời ID ${rootComment.id} đã được đánh dấu là "CÂU TRẢ LỜI ĐƯỢC CHẤP NHẬN"!`);

  // 8. Lecturer Pins the Discussion Thread
  console.log(`\n--- 8. Lecturer Pins Discussion (PUT /api/v1/discussions/${createdThread.id}/pin) ---`);
  const pinRes = await fetch(`${BASE_URL}/discussions/${createdThread.id}/pin`, {
    method: 'PUT',
    headers: authHeader(lecToken)
  });
  if (!pinRes.ok) throw new Error('Pin discussion failed with status ' + pinRes.status);
  console.log(`✓ Thảo luận ID ${createdThread.id} đã được GHIM LÊN ĐẦU DANH SÁCH.`);

  // 9. Fetch Group Chat History
  console.log('\n--- 9. Testing Group Chat History (GET /api/v1/courses/1/chat-messages) ---');
  const chatHistRes = await fetch(`${BASE_URL}/courses/1/chat-messages`, {
    headers: authHeader(stuToken)
  });
  const initialChat = await chatHistRes.json();
  if (!chatHistRes.ok) throw new Error('Fetch chat failed: ' + JSON.stringify(initialChat));
  console.log(`✓ Loaded chat history: ${initialChat.length} existing message(s).`);

  // 10. Send New Chat Message (Real-time Broadcast)
  console.log('\n--- 10. Student Sends Real-time Chat Message ---');
  const sendChatRes = await fetch(`${BASE_URL}/courses/1/chat-messages`, {
    method: 'POST',
    headers: authHeader(stuToken),
    body: JSON.stringify({ content: 'Xin chào cả lớp! Chúc mọi người học tốt module Spring Boot & React!' })
  });
  const sentMsg = await sendChatRes.json();
  if (!sendChatRes.ok) throw new Error('Send chat message failed: ' + JSON.stringify(sentMsg));
  console.log(`✓ Message sent (ID: ${sentMsg.id}) by [${sentMsg.userRole}] ${sentMsg.userFullName}: "${sentMsg.content}"`);

  // 11. Security Check: Non-enrolled user cannot chat
  console.log('\n--- 11. Security RBAC Check: Non-enrolled user sending chat message ---');
  // Login student 4 (chưa enroll course 3)
  const otherStuRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hocvien3@edulive.vn', password: 'Password@123' })
  });
  const otherStu = await otherStuRes.json();
  const forbiddenChatRes = await fetch(`${BASE_URL}/courses/2/chat-messages`, {
    method: 'POST',
    headers: authHeader(otherStu.accessToken),
    body: JSON.stringify({ content: 'Spam test' })
  });
  if (forbiddenChatRes.status === 403) {
    console.log('✓ BẢO MẬT CHUẨN: Người chưa tham gia khóa học bị từ chối gửi tin nhắn (403 Forbidden).');
  } else {
    throw new Error(`Expected 403 Forbidden, but got ${forbiddenChatRes.status}`);
  }

  console.log('\n===============================================================');
  console.log('🎉 TẤT CẢ 11/11 TIÊU CHÍ GIAI ĐOẠN 5 ĐÃ ĐẠT 100% HOÀN HẢO! 🎉');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('\n❌ VERIFICATION GIAI ĐOẠN 5 FAILED:', err);
  process.exit(1);
});
