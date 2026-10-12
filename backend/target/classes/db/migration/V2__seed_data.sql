-- ====================================================================
-- EduLive Platform: Database Migration V2
-- Seed Initial Demo Data
-- Password for all seed accounts: Password@123
-- BCrypt Hash: $2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O
-- ====================================================================

-- 1. Insert Users: 1 Admin, 2 Lecturers, 5 Students
INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, status) VALUES
(1, 'admin@edulive.vn', '$2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O', 'Hệ Thống Quản Trị', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin', 'ADMIN', 'ACTIVE'),
(2, 'giangvien1@edulive.vn', '$2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O', 'ThS. Nguyễn Văn A', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lecturer1', 'LECTURER', 'ACTIVE'),
(3, 'giangvien2@edulive.vn', '$2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O', 'TS. Trần Thị B', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lecturer2', 'LECTURER', 'ACTIVE'),
(4, 'hocvien1@edulive.vn', '$2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O', 'Lê Hoàng C', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1', 'STUDENT', 'ACTIVE'),
(5, 'hocvien2@edulive.vn', '$2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O', 'Phạm Minh D', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2', 'STUDENT', 'ACTIVE'),
(6, 'hocvien3@edulive.vn', '$2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O', 'Hoàng Thu E', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student3', 'STUDENT', 'ACTIVE'),
(7, 'hocvien4@edulive.vn', '$2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O', 'Vũ Đình F', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student4', 'STUDENT', 'ACTIVE'),
(8, 'hocvien5@edulive.vn', '$2a$10$k21mm5sNG2CGq6ywZtnTzuBIgk.ndgnXexm9.q2mnuiMfGZt/IT/O', 'Đặng Lan G', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student5', 'STUDENT', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. Insert Categories
INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Lập trình Web & Phần mềm', 'lap-trinh-web', 'Khóa học về kiến trúc web full-stack, Spring Boot, React, kiến trúc vi dịch vụ và cơ sở dữ liệu.'),
(2, 'Khoa học Máy tính', 'khoa-hoc-may-tinh', 'Thuật toán, cấu trúc dữ liệu, tối ưu hóa hiệu năng và tư duy lập trình chuyên sâu.'),
(3, 'Mạng máy tính & Real-time', 'mang-may-tinh-realtime', 'Giao thức mạng, WebRTC, WebSocket STOMP và các ứng dụng thời gian thực đa phương tiện.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 3. Insert Courses
INSERT INTO courses (id, title, slug, description, thumbnail_url, category_id, lecturer_id, class_code, status) VALUES
(1, 'Lập trình Web Full-stack với Spring Boot và React', 'lap-trinh-web-fullstack-spring-boot-react', 'Khóa học thực chiến làm chủ kiến trúc Monorepo, phát triển RESTful API chuẩn mực với Spring Boot 3 và giao diện hiện đại với React Vite TypeScript cùng Tailwind CSS.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', 1, 2, 'FSW101', 'PUBLISHED'),
(2, 'Cấu trúc Dữ liệu và Giải thuật Ứng dụng', 'cau-truc-du-lieu-va-giai-thuat-ung-dung', 'Nắm vững các thuật toán cốt lõi, mảng, danh sách liên kết, cây nhị phân và tối ưu độ phức tạp thời gian Big-O trong các bài toán thực tế.', 'https://images.unsplash.com/photo-1516116211227-bbc04f141443?w=800&q=80', 2, 3, 'DSA202', 'PUBLISHED'),
(3, 'Giao thức Mạng và Lập trình Real-time với WebRTC', 'giao-thuc-mang-va-lap-trinh-real-time-webrtc', 'Khám phá thế giới thời gian thực với WebSocket, STOMP Messaging và xây dựng hệ thống Video Call P2P Mesh sử dụng WebRTC thuần không phụ thuộc bên thứ ba.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', 3, 2, 'NET303', 'PUBLISHED')
ON CONFLICT (id) DO NOTHING;

SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

-- 4. Insert Chapters
INSERT INTO chapters (id, course_id, title, order_index) VALUES
(1, 1, 'Chương 1: Khởi động dự án và Kiến trúc Monorepo', 1),
(2, 1, 'Chương 2: Thiết kế Frontend SPA với React và Tailwind', 2),
(3, 2, 'Chương 1: Độ phức tạp thuật toán và Mảng', 1),
(4, 2, 'Chương 2: Danh sách liên kết và Ngăn xếp', 2),
(5, 3, 'Chương 1: Tổng quan WebSocket và Giao thức STOMP', 1),
(6, 3, 'Chương 2: Kiến trúc WebRTC Mesh P2P', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('chapters_id_seq', (SELECT MAX(id) FROM chapters));

-- 5. Insert Lessons
INSERT INTO lessons (id, chapter_id, title, content_type, content_url, duration_seconds, order_index) VALUES
-- Khóa 1 - Chương 1
(1, 1, 'Giới thiệu hệ sinh thái Spring Boot 3 và Java 17/21', 'VIDEO', 'https://www.youtube.com/watch?v=9SGDpanrc8U', 720, 1),
(2, 1, 'Thiết kế RESTful API và tài liệu hóa bằng OpenAPI Swagger', 'ARTICLE', 'Chào mừng bạn đến với bài học thiết kế API chuẩn REST. Trong bài học này, chúng ta sẽ tìm hiểu về cách phân tầng Controller -> Service -> Repository và chuẩn hóa mã phản hồi HTTP.', 0, 2),
-- Khóa 1 - Chương 2
(3, 2, 'Xây dựng giao diện hiện đại với React, Vite và Tailwind CSS', 'VIDEO', 'https://www.youtube.com/watch?v=bMknfKXIFA8', 950, 1),
(4, 2, 'Tài liệu hướng dẫn kết nối STOMP Client trong React', 'PDF', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 0, 2),

-- Khóa 2 - Chương 1
(5, 3, 'Phân tích độ phức tạp thời gian Big-O và bài toán thực tế', 'VIDEO', 'https://www.youtube.com/watch?v=__vX2sjlpXU', 600, 1),
(6, 3, 'Kỹ thuật hai con trỏ (Two Pointers) trên mảng', 'ARTICLE', 'Kỹ thuật hai con trỏ là phương pháp hữu hiệu giúp giảm độ phức tạp từ O(n^2) xuống còn O(n) khi xử lý mảng đã sắp xếp.', 0, 2),
-- Khóa 2 - Chương 2
(7, 4, 'Cài đặt Danh sách liên kết đơn trong Java', 'VIDEO', 'https://www.youtube.com/watch?v=njTh_OwMljA', 840, 1),

-- Khóa 3 - Chương 1
(8, 5, 'Bản chất cơ chế bắt tay WebSocket (Handshake) và STOMP Frame', 'VIDEO', 'https://www.youtube.com/watch?v=2hVz5k7OsqY', 780, 1),
-- Khóa 3 - Chương 2
(9, 6, 'Quy trình Signaling trong WebRTC: Offer, Answer và ICE Candidate', 'ARTICLE', 'Signaling là bước trao đổi siêu dữ liệu kết nối mạng giữa các trình duyệt. STOMP message broker đóng vai trò trung gian chuyển giao SDP và candidate.', 0, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons));

-- 6. Insert Quizzes
INSERT INTO quizzes (id, course_id, chapter_id, title, description, time_limit_minutes, max_attempts, passing_score) VALUES
(1, 1, 1, 'Kiểm tra trắc nghiệm: Tổng quan Full-stack Architecture', 'Bài kiểm tra đánh giá kiến thức về Spring Boot, kiến trúc monorepo và giao thức STOMP.', 15, 3, 60.0),
(2, 2, 3, 'Kiểm tra trắc nghiệm: Độ phức tạp thuật toán và Mảng', 'Đánh giá khả năng phân tích Big-O và thao tác cơ bản trên mảng số học.', 10, 3, 50.0),
(3, 3, 5, 'Kiểm tra trắc nghiệm: Giao thức WebRTC và Signaling', 'Đánh giá hiểu biết về vai trò của STUN/TURN, luồng trao đổi Offer/Answer SDP.', 20, 3, 60.0)
ON CONFLICT (id) DO NOTHING;

SELECT setval('quizzes_id_seq', (SELECT MAX(id) FROM quizzes));

-- 7. Insert Quiz Questions & Options
-- Quiz 1 Questions
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, explanation, points, order_index) VALUES
(1, 1, 'Spring Boot mặc định sử dụng Web Server nhúng nào để chạy ứng dụng?', 'SINGLE_CHOICE', 'Spring Boot Web mặc định tích hợp Apache Tomcat làm embedded servlet container.', 1.0, 1),
(2, 1, 'Những phát biểu nào sau đây là ĐÚNG về STOMP trên nền WebSocket? (Chọn nhiều đáp án)', 'MULTIPLE_CHOICE', 'STOMP cung cấp giao thức text frame rõ ràng và mô hình topic pub/sub tích hợp hoàn hảo với Spring Security.', 1.0, 2),
(3, 1, 'React Router v6 cho phép thực hiện Client-side Routing mà không cần tải lại toàn bộ trang web?', 'TRUE_FALSE', 'Chính xác! React Router chặn sự kiện chuyển trang của trình duyệt và chỉ render lại các component cần thiết trong DOM.', 1.0, 3);


INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index) VALUES
-- Câu 1 (Single)
(1, 1, 'Apache Tomcat', true, 1),
(2, 1, 'Eclipse Jetty', false, 2),
(3, 1, 'Oracle GlassFish', false, 3),
(4, 1, 'Undertow', false, 4),
-- Câu 2 (Multiple)
(5, 2, 'Có cấu trúc frame chuẩn rõ ràng (COMMAND, HEADERS, BODY)', true, 1),
(6, 2, 'Tích hợp sẵn mô hình pub/sub destination (/topic, /queue, /app)', true, 2),
(7, 2, 'Chỉ hoạt động qua giao thức UDP không tin cậy', false, 3),
(8, 2, 'Có thể kiểm soát quyền truy cập qua Spring Security ChannelInterceptor', true, 4),
-- Câu 3 (True/False)
(9, 3, 'Đúng', true, 1),
(10, 3, 'Sai', false, 2);

-- Quiz 2 Questions
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, explanation, points, order_index) VALUES
(4, 2, 'Thuật toán tìm kiếm nhị phân (Binary Search) có độ phức tạp thời gian trong trường hợp xấu nhất là gì?', 'SINGLE_CHOICE', 'Tìm kiếm nhị phân chia đôi không gian tìm kiếm sau mỗi bước nên có độ phức tạp là O(log n).', 1.0, 1),
(5, 2, 'Thao tác chèn một phần tử vào đầu danh sách liên kết đơn có độ phức tạp thời gian là O(1)?', 'TRUE_FALSE', 'Đúng, việc chèn đầu danh sách liên kết chỉ cần thay đổi con trỏ head, không phụ thuộc vào số lượng phần tử.', 1.0, 2),
(6, 2, 'Những thuật toán sắp xếp nào sau đây có độ phức tạp trung bình O(n log n)?', 'MULTIPLE_CHOICE', 'Merge Sort và Quick Sort đều có độ phức tạp thời gian trung bình O(n log n).', 1.0, 3);

INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index) VALUES
(11, 4, 'O(1)', false, 1),
(12, 4, 'O(log n)', true, 2),
(13, 4, 'O(n)', false, 3),
(14, 4, 'O(n^2)', false, 4),
(15, 5, 'Đúng', true, 1),
(16, 5, 'Sai', false, 2),
(17, 6, 'Merge Sort', true, 1),
(18, 6, 'Quick Sort', true, 2),
(19, 6, 'Bubble Sort', false, 3),
(20, 6, 'Selection Sort', false, 4);

-- Quiz 3 Questions
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, explanation, points, order_index) VALUES
(7, 3, 'Máy chủ nào trong WebRTC được sử dụng để khám phá địa chỉ IP công khai và cổng của một thiết bị sau NAT?', 'SINGLE_CHOICE', 'STUN (Session Traversal Utilities for NAT) được dùng để xác định địa chỉ công khai.', 1.0, 1),
(8, 3, 'Mô hình mạng Mesh P2P trong WebRTC thích hợp cho phòng họp trực tuyến tối đa khoảng bao nhiêu người?', 'SINGLE_CHOICE', 'Mesh P2P yêu cầu mỗi client gửi N-1 stream nên thích hợp cho tối đa khoảng 4 đến 6 người.', 1.0, 2),
(9, 3, 'Giao thức STOMP WebSocket có thể được dùng làm Signaling Channel để trao đổi SDP Offer/Answer?', 'TRUE_FALSE', 'Hoàn toàn chính xác, STOMP là kênh trao đổi tín hiệu lý tưởng nhờ cơ chế topic pub/sub.', 1.0, 3);

INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index) VALUES
(21, 7, 'STUN Server', true, 1),
(22, 7, 'TURN Server', false, 2),
(23, 7, 'DHCP Server', false, 3),
(24, 7, 'DNS Server', false, 4),
(25, 8, 'Dưới 6 người', true, 1),
(26, 8, 'Khoảng 50 người', false, 2),
(27, 8, 'Khoảng 500 người', false, 3),
(28, 8, 'Không giới hạn', false, 4),
(29, 9, 'Đúng', true, 1),
(30, 9, 'Sai', false, 2);

SELECT setval('quiz_questions_id_seq', (SELECT MAX(id) FROM quiz_questions));
SELECT setval('quiz_options_id_seq', (SELECT MAX(id) FROM quiz_options));

-- 8. Insert Enrollments (Học viên tham gia khóa học)
INSERT INTO enrollments (id, user_id, course_id, progress_percent, enrolled_at) VALUES
(1, 4, 1, 25.0, CURRENT_TIMESTAMP),
(2, 5, 1, 50.0, CURRENT_TIMESTAMP),
(3, 4, 2, 0.0, CURRENT_TIMESTAMP),
(4, 6, 3, 0.0, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('enrollments_id_seq', (SELECT MAX(id) FROM enrollments));

-- 9. Insert Lesson Completions (Tiến độ bài học mẫu)
INSERT INTO lesson_completions (id, enrollment_id, lesson_id, completed_at) VALUES
(1, 1, 1, CURRENT_TIMESTAMP),
(2, 2, 1, CURRENT_TIMESTAMP),
(3, 2, 2, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('lesson_completions_id_seq', (SELECT MAX(id) FROM lesson_completions));

-- 10. Insert Sample Discussions & Comments
INSERT INTO discussions (id, course_id, lesson_id, user_id, title, content, is_pinned) VALUES
(1, 1, 1, 4, 'Làm thế nào để cấu hình CORS cho WebSocket trong Spring Boot?', 'Em chào thầy, khi kết nối từ frontend Vite port 5173 tới Spring Boot port 8080 thì bị lỗi CORS trên endpoint /ws. Thầy hướng dẫn em cách fix với ạ!', true),
(2, 2, 5, 5, 'Tại sao Binary Search lại yêu cầu mảng phải được sắp xếp trước?', 'Mình thắc mắc nếu mảng chưa sắp xếp thì thuật toán tìm kiếm nhị phân sẽ sai ở bước nào?', false)
ON CONFLICT (id) DO NOTHING;

SELECT setval('discussions_id_seq', (SELECT MAX(id) FROM discussions));

INSERT INTO discussion_comments (id, discussion_id, parent_id, user_id, content, is_accepted_answer) VALUES
(1, 1, NULL, 2, 'Chào em, trong WebSocketConfig em cần dùng `.setAllowedOriginPatterns("*")` hoặc chỉ định cụ thể `http://localhost:5173` trên StompEndpointRegistry nhé!', true),
(2, 1, 1, 4, 'Dạ em cảm ơn thầy nhiều, em đã cấu hình được rồi ạ!', false),
(3, 2, NULL, 3, 'Chào bạn, Binary Search dựa trên tính chất phần tử giữa lớn hơn hoặc nhỏ hơn giá trị tìm kiếm để loại bỏ một nửa mảng. Nếu chưa sắp xếp thì giả định này không còn đúng.', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('discussion_comments_id_seq', (SELECT MAX(id) FROM discussion_comments));

-- 11. Insert Sample Video Room
INSERT INTO video_rooms (id, course_id, host_id, room_code, title, is_active, scheduled_at) VALUES
(1, 1, 2, 'ROOM-FSW101', 'Phòng học trực tuyến: Q&A Khóa học Full-stack Spring Boot & React', true, CURRENT_TIMESTAMP + INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

SELECT setval('video_rooms_id_seq', (SELECT MAX(id) FROM video_rooms));

-- 12. Insert Sample Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, link) VALUES
(1, 4, 'Chào mừng bạn đến với EduLive!', 'Bạn đã tham gia khóa học Lập trình Web Full-stack thành công.', 'COURSE_ENROLLED', true, '/courses/1'),
(2, 4, 'Thảo luận của bạn có câu trả lời mới', 'ThS. Nguyễn Văn A đã trả lời câu hỏi thảo luận của bạn.', 'DISCUSSION_REPLY', false, '/courses/1/discussions/1')
ON CONFLICT (id) DO NOTHING;

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
