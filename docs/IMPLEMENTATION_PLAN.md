# KẾ HOẠCH TRIỂN KHAI DỰ ÁN HỌC TRỰC TUYẾN "EDULIVE"
*Tài liệu Đặc tả Kỹ thuật & Kế hoạch Thực hiện (Implementation Plan)*

---

## 1. TỔNG QUAN VÀ GIẢ ĐỊNH KỸ THUẬT (ASSUMPTIONS & ARCHITECTURAL DECISIONS)

### 1.1 Mục tiêu dự án
Xây dựng nền tảng học trực tuyến **EduLive** (tham khảo mô hình Google Classroom & Coursera) theo cấu trúc Monorepo gồm 2 ứng dụng độc lập:
- **Backend**: Spring Boot 3.x (Java 17/21), REST API, Spring WebSocket (STOMP), Spring Security + JWT (Access + Refresh), Spring Data JPA, PostgreSQL, Flyway migration, springdoc-openapi (Swagger UI), Lombok, MapStruct.
- **Frontend**: React 18+ (Vite, TypeScript, Tailwind CSS), React Router v6, Axios (Interceptor tự refresh token), TanStack Query, `@stomp/stompjs`, WebRTC Mesh P2P thuần (tối đa 6 người/phòng), Dark mode.
- **Hạ tầng & Đóng gói**: Docker Compose, Multi-stage Dockerfiles, Nginx Reverse Proxy (hỗ trợ HTTP & WebSocket Upgrade), Coturn TURN/STUN server, Shell scripts backup & deploy.

---

### 1.2 Các quyết định kỹ thuật then chốt & Giả định

1. **Lý do lựa chọn STOMP thay vì Socket.IO cho Backend Java**:
   - **Lý do kỹ thuật**: Socket.IO không có server implementation chính thức được duy trì bởi Spring/Pivotal. Thư viện bên thứ ba `netty-socketio` chạy trên một Netty server riêng biệt, phải mở và lắng nghe trên một cổng riêng ngoài cổng của Spring Tomcat (ví dụ cổng 9092), gây phức tạp trong việc cấu hình tường lửa, phân quyền Spring Security và Nginx reverse proxy.
   - **Ưu thế STOMP**: Spring Boot cung cấp `spring-boot-starter-websocket` với giao thức STOMP trên nền WebSocket chuẩn (RFC 6455). STOMP tích hợp sâu và tự nhiên với Spring Security (`ChannelInterceptor`, `@MessageMapping`), sử dụng chung port HTTP (8080), hỗ trợ định tuyến pub/sub topic rõ ràng (`/topic`, `/queue`, `/app`), đồng thời frontend dùng thư viện chuẩn công nghiệp `@stomp/stompjs`.

2. **Môi trường Java & Build**:
   - Môi trường máy chủ phát triển hiện có OpenJDK 17. Spring Boot 3.3.x hỗ trợ cả Java 17 và Java 21 LTS. Backend sẽ được cấu hình tương thích `sourceCompatibility = 17` và container hóa với Eclipse Temurin OpenJDK 21 LTS khi đóng gói Docker.
   - Sử dụng Maven Wrapper (`./mvnw` và `mvnw.cmd`) tích hợp sẵn trong repo để đảm bảo việc build độc lập, không phụ thuộc vào Maven toàn cục trên máy.

3. **Cơ sở dữ liệu & Seed Data**:
   - PostgreSQL 16 chạy qua Docker Compose (`docker-compose.dev.yml` cho dev, `docker-compose.prod.yml` cho prod).
   - Migration bằng **Flyway**: `V1__init_schema.sql` (bảng, chỉ mục, khóa ngoại) và `V2__seed_data.sql` (1 Admin, 2 Giảng viên, 5 Học viên, 3 Khóa học mẫu đầy đủ bài giảng & quiz).
   - Mật khẩu mặc định cho các tài khoản seed: `Password@123` (được băm bằng BCrypt).

4. **Lưu trữ tệp tin (File & Video Storage)**:
   - Tuân thủ nguyên tắc không dùng dịch vụ trả phí / bên ngoài: Lưu trữ video upload, PDF, avatar trong thư mục tĩnh nội bộ (`backend/uploads/` hoặc mount volume Docker `/app/uploads`) và phân phối qua Spring Resource Handler hoặc Nginx `/uploads/`.
   - Hỗ trợ cả nhúng video link YouTube trực tiếp bên cạnh video tải lên máy chủ.

5. **Giải pháp Video Call WebRTC**:
   - **Topology**: Mesh P2P (Peer-to-Peer) thuần, tối đa 6 người/phòng.
   - **Signaling**: Trao đổi SDP Offer, Answer và ICE Candidates thông qua STOMP channel: `/app/webrtc/{roomId}/signal` -> `/topic/room/{roomId}/signal`.
   - **ICE Server**: Mặc định Google STUN (`stun:stun.l.google.com:19302`), hỗ trợ cấu hình ICE Server (STUN/TURN) tùy biến đọc qua biến môi trường frontend và backend.

6. **Bảo mật & Rate Limiting**:
   - Stateless JWT: Access Token (thời hạn 15-30 phút), Refresh Token (thời hạn 7 ngày lưu trong DB, có cơ chế thu hồi).
   - Rate limiting trên endpoint nhạy cảm `/api/v1/auth/login` (dùng Bucket4j hoặc In-memory token bucket).
   - Chấm Quiz bảo mật: Server-side validation 100%. Thời gian bắt đầu và kết thúc lưu tại backend (`started_at`, `submitted_at`). Kiểm tra `submitted_at <= started_at + time_limit + 10s (grace period network)`.

---

## 2. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

```
[ Trình duyệt Người dùng (React SPA) ]
  ├── UI Components (Tailwind CSS, Dark Mode, Lucide Icons)
  ├── Client State (React Context, TanStack Query)
  ├── Realtime Clients:
  │     ├── STOMP Client (@stomp/stompjs) ──► WebSocket (/ws)
  │     └── WebRTC RTCPeerConnection (Mesh) ──► P2P Media Streams
  └── Axios Interceptor (Auto Refresh JWT) ──► REST APIs (/api/v1)
                  │
                  ▼ [Nginx Reverse Proxy: Port 80/443]
       ┌──────────┴─────────────────────────┐
       │ (Phục vụ SPA & Định tuyến)         │
       │  /       ──► Static Build Files    │
       │  /api/   ──► Spring Boot (Port 8080)│
       │  /ws/    ──► Spring Boot WebSocket │
       │  /uploads──► Media Volume          │
       └────────────────────────────────────┘
                  │
                  ▼
[ Backend: Spring Boot 3 Layered Architecture ]
  ├── Security Layer: JwtFilter, SecurityConfig, Role RBAC (@PreAuthorize)
  ├── Controller Layer: REST Controllers (@RestController, OpenAPI/Swagger)
  ├── WebSocket Controller: @MessageMapping, STOMP Broker
  ├── Service Layer: Business Logic, Quiz Auto-grader, WebRTC Signaler
  ├── Repository Layer: Spring Data JPA Repositories
  └── Persistence: PostgreSQL Database (Flyway Migrations)
```

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN (MONOREPO DIRECTORY STRUCTURE)

```
edulive/
├── .gitignore
├── README.md
│
├── backend/
│   ├── .mvn/wrapper/
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   ├── uploads/                      # Thư mục lưu file local (video, pdf, avatar)
│   └── src/
│       ├── main/
│       │   ├── java/com/edulive/
│       │   │   ├── EduliveApplication.java
│       │   │   ├── common/           # Response wrapper, Paging, Constants
│       │   │   ├── config/           # Cấu hình Spring (Security, JWT, WebSocket, WebMvc, OpenAPI, RateLimit)
│       │   │   ├── security/         # JWT filter, UserPrincipal, AuthEntryPoint, SecurityUtils
│       │   │   ├── controller/       # REST API endpoints (Auth, User, Course, Chapter, Lesson, Quiz, Discussion, VideoRoom, ...)
│       │   │   ├── websocket/        # STOMP message handlers (Chat, WebRTC Signaling)
│       │   │   ├── entity/           # JPA Entities (User, Role, Course, Chapter, Lesson, Quiz, QuizAttempt, Discussion, VideoRoom, ...)
│       │   │   ├── repository/       # Spring Data JPA interfaces
│       │   │   ├── service/          # Business logic interfaces & Impls
│       │   │   ├── mapper/           # MapStruct mappers
│       │   │   ├── dto/              # Request / Response DTOs
│       │   │   └── exception/        # Global Exception Handling (@RestControllerAdvice)
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       ├── application-prod.yml
│       │       └── db/migration/
│       │           ├── V1__init_schema.sql
│       │           └── V2__seed_data.sql
│       └── test/java/com/edulive/    # Unit & Integration tests (Auth, QuizGrading, Course)
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example
│   ├── .env.development
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── types/                    # TypeScript interfaces
│       ├── services/                 # API calls (Axios interceptor) & WebSocket & WebRTC
│       ├── context/                  # AuthContext, ThemeContext, SocketContext
│       ├── hooks/                    # useAuth, useTheme, useWebRTC, useQuizTimer
│       ├── components/               # Common, Layout, Course, Quiz, Discussion, Video, Dashboard
│       └── pages/                    # Home, Login, Register, CourseList, CourseDetail, Learning, QuizTaking, QuizResult, VideoRoom, Dashboard
│
├── deploy/
│   ├── backend/Dockerfile            # Multi-stage: Maven build -> JRE 21 slim
│   ├── frontend/Dockerfile           # Multi-stage: Vite build -> Nginx Alpine
│   ├── nginx/nginx.conf              # Reverse proxy cho /, /api, /ws (Upgrade)
│   ├── coturn/turnserver.conf        # Config TURN/STUN mẫu
│   ├── docker-compose.dev.yml        # Chỉ Postgres cho dev local
│   ├── docker-compose.prod.yml       # Postgres, Backend, Frontend, Nginx, Coturn
│   ├── .env.example
│   ├── deploy.sh
│   └── backup-db.sh
│
└── docs/
    ├── ERD.md                        # Sơ đồ quan hệ thực thể & Data Dictionary
    ├── ARCHITECTURE.md               # Kiến trúc WebRTC, Signaling & STOMP
    └── API_DOCUMENTATION.md          # Đặc tả chi tiết các REST APIs
```

---

## 4. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE ERD & SCHEMA)

### 4.1 Mô hình quan hệ thực thể (ERD)

- **`users`** (1) ──── (N) **`refresh_tokens`**
- **`users`** (1) ──── (N) **`courses`** (Vai trò Giảng viên)
- **`users`** (1) ──── (N) **`enrollments`** (Học viên tham gia)
- **`users`** (1) ──── (N) **`quiz_attempts`**
- **`users`** (1) ──── (N) **`discussions`**
- **`users`** (1) ──── (N) **`discussion_comments`**
- **`users`** (1) ──── (N) **`chat_messages`**
- **`users`** (1) ──── (N) **`notifications`**
- **`categories`** (1) ──── (N) **`courses`**
- **`courses`** (1) ──── (N) **`chapters`**
- **`chapters`** (1) ──── (N) **`lessons`**
- **`courses`** (1) ──── (N) **`quizzes`**
- **`quizzes`** (1) ──── (N) **`quiz_questions`**
- **`quiz_questions`** (1) ──── (N) **`quiz_options`**
- **`quiz_attempts`** (1) ──── (N) **`quiz_answers`**
- **`enrollments`** (1) ──── (N) **`lesson_completions`**
- **`discussions`** (1) ──── (N) **`discussion_comments`** (Cây thảo luận lồng nhau)
- **`courses`** (1) ──── (N) **`video_rooms`**

---

## 5. DANH SÁCH RESTFUL APIS VÀ WEBSOCKET DESTINATIONS

### 5.1 Nhóm API Xác thực & Người dùng
- `POST /api/v1/auth/register` - Đăng ký tài khoản mới
- `POST /api/v1/auth/login` - Đăng nhập (Access Token + Refresh Token, Rate Limiting)
- `POST /api/v1/auth/refresh-token` - Đổi token mới bằng refresh token
- `POST /api/v1/auth/logout` - Đăng xuất & thu hồi refresh token
- `GET /api/v1/users/me` - Lấy thông tin user đăng nhập hiện tại
- `PUT /api/v1/users/profile` - Cập nhật thông tin cá nhân
- `PUT /api/v1/users/change-password` - Đổi mật khẩu

### 5.2 Nhóm API Khóa học & Bài giảng
- `GET /api/v1/courses` - Danh sách khóa học (Tìm kiếm, danh mục, phân trang)
- `GET /api/v1/courses/{id}` - Chi tiết khóa học và cấu trúc chương/bài giảng
- `POST /api/v1/courses` - Tạo khóa học mới (Giảng viên)
- `PUT /api/v1/courses/{id}` - Sửa khóa học
- `DELETE /api/v1/courses/{id}` - Xóa khóa học
- `POST /api/v1/courses/{id}/chapters` - Thêm chương
- `PUT /api/v1/chapters/{id}` - Sửa chương
- `DELETE /api/v1/chapters/{id}` - Xóa chương
- `POST /api/v1/chapters/{chapterId}/lessons` - Thêm bài giảng (Video/PDF/Article)
- `PUT /api/v1/lessons/{id}` - Sửa bài giảng
- `DELETE /api/v1/lessons/{id}` - Xóa bài giảng
- `GET /api/v1/lessons/{id}` - Nội dung chi tiết bài học

### 5.3 Nhóm API Đăng ký học & Tiến độ
- `POST /api/v1/enrollments/join` - Đăng ký bằng Course ID hoặc mã lớp (`class_code`)
- `GET /api/v1/enrollments/my-courses` - Danh sách khóa học đã đăng ký
- `POST /api/v1/enrollments/{courseId}/lessons/{lessonId}/complete` - Đánh dấu hoàn thành bài học
- `GET /api/v1/enrollments/{courseId}/progress` - Lấy % và trạng thái tiến độ khóa học

### 5.4 Nhóm API Quiz
- `GET /api/v1/courses/{courseId}/quizzes` - Danh sách quiz trong khóa học
- `POST /api/v1/courses/{courseId}/quizzes` - Tạo quiz mới
- `PUT /api/v1/quizzes/{id}` - Sửa quiz
- `POST /api/v1/quizzes/{id}/questions` - Thêm câu hỏi và các lựa chọn
- `POST /api/v1/quizzes/{id}/start` - Bắt đầu làm quiz (Khởi tạo `QuizAttempt`, ẩn đáp án đúng)
- `POST /api/v1/quizzes/attempts/{attemptId}/submit` - Nộp bài quiz (Chấm điểm phía server, kiểm tra thời gian)
- `GET /api/v1/quizzes/attempts/{attemptId}/result` - Xem điểm số, đáp án đúng và giải thích
- `GET /api/v1/quizzes/{id}/statistics` - Giảng viên xem phổ điểm và danh sách bài nộp
- `GET /api/v1/quizzes/{id}/export-csv` - Xuất danh sách điểm thi ra file CSV

### 5.5 Nhóm API Diễn đàn & Thảo luận
- `GET /api/v1/courses/{courseId}/discussions` - Danh sách chủ đề thảo luận
- `POST /api/v1/courses/{courseId}/discussions` - Tạo chủ đề mới
- `GET /api/v1/discussions/{id}` - Chi tiết chủ đề và bình luận lồng nhau
- `POST /api/v1/discussions/{id}/comments` - Gửi bình luận / trả lời bình luận (`parentId`)
- `PUT /api/v1/discussions/comments/{commentId}/accept` - Đánh dấu câu trả lời đúng

### 5.6 Nhóm API Video Call WebRTC
- `POST /api/v1/video-rooms` - Tạo phòng video theo lịch
- `GET /api/v1/video-rooms/{roomCode}` - Kiểm tra tính hợp lệ và thông tin phòng
- `GET /api/v1/video-rooms/ice-servers` - Cung cấp cấu hình STUN/TURN server từ biến môi trường

### 5.7 Nhóm API Dashboard & Thông báo
- `GET /api/v1/dashboard/student` - Thống kê học viên (khóa đang học, tiến độ, quiz sắp tới)
- `GET /api/v1/dashboard/lecturer` - Thống kê giảng viên (học viên, điểm trung bình, thảo luận mới)
- `GET /api/v1/notifications` - Danh sách thông báo
- `PUT /api/v1/notifications/{id}/read` - Đánh dấu thông báo đã đọc

### 5.8 WebSocket STOMP Topics & Destinations
- `STOMP Endpoint`: `/ws` (kèm JWT Header: `Authorization: Bearer <token>`)
- `Send: /app/chat/{courseId}` -> `Subscribe: /topic/course/{courseId}/chat` (Chat real-time trong khóa học)
- `Send: /app/webrtc/{roomCode}/signal` -> `Subscribe: /topic/room/{roomCode}/signal` (WebRTC signaling mesh: peer-join, offer, answer, ice-candidate, peer-leave, hand-raise)
- `Subscribe: /user/queue/notifications` (Thông báo cá nhân thời gian thực)

---

## 6. TIẾN ĐỘ THỰC HIỆN TUẦN TỰ (STATUS CHECKLIST)

- [x] **Giai đoạn 1: Khởi tạo Monorepo, Database & Seed Data [HOÀN THÀNH 100%]**
  - Cấu trúc monorepo: `backend/`, `frontend/`, `deploy/`, `docs/`.
  - Docker Compose PostgreSQL 16 (`edulive_postgres_dev`).
  - Flyway migration `V1__init_schema.sql` (18 bảng hoàn chỉnh).
  - Flyway migration `V2__seed_data.sql` (8 users mật khẩu `Password@123`, 3 khóa học, 3 quizzes).
  - Cầu nối mạng WSL Postgres bridge `wsl-pg-bridge.js` hoạt động ổn định trên port 5432.

- [x] **Giai đoạn 2: Xác thực & Phân quyền JWT, RBAC & Hồ sơ [HOÀN THÀNH 100%]**
  - Backend: JWT Stateless (Access Token HMAC-SHA256 30 phút, Refresh Token 7 ngày trong DB).
  - Mã hóa BCrypt mật khẩu, RateLimiter (tối đa 5 lần thử/phút chống brute-force).
  - Phân quyền RBAC (`ADMIN`, `LECTURER`, `STUDENT`) bảo vệ bởi `@PreAuthorize`.
  - Endpoints: Đăng ký, Đăng nhập, Refresh Token, Đăng xuất, GET `/users/me`, PUT `/users/profile`, PUT `/users/change-password`.
  - Frontend: `AuthContext`, `api.ts` Axios interceptor tự động refresh token trong suốt.
  - UI: `Navbar` (avatar, tên, role badge, logout), `LoginPage` (kèm nút điền nhanh 4 tài khoản demo), `RegisterPage`, `ProfilePage` (cập nhật tên/avatar và đổi mật khẩu).
  - `HomePage` tích hợp bảng tài khoản demo, trạng thái hệ thống, danh sách giai đoạn.
  - Kiểm thử: 7/7 JUnit5 tests pass, script tự động `deploy/verify_phase2.js` đạt 8/8 tiêu chí 100%.

- [x] **Giai đoạn 3: Khóa học, Bài giảng & Tiến độ học tập [HOÀN THÀNH 100%]**
  - Backend Entities & Repositories: `Category`, `Course`, `Chapter`, `Lesson`, `Enrollment`, `LessonCompletion`.
  - Sinh tự động mã lớp `class_code` 6 ký tự độc nhất (chữ in hoa + số) kiểu Google Classroom.
  - Quản lý khóa học, danh mục, chương và bài giảng (VIDEO, ARTICLE, PDF).
  - API đăng ký học bằng `courseId` hoặc nhập mã lớp `class_code`.
  - Hoàn thành bài học, tự động tính % tiến độ và thời điểm hoàn thành `completed_at`.
  - Hỗ trợ lưu trữ tệp cục bộ qua `FileController` (`/api/v1/files/upload`).
  - Frontend: `CourseCard`, `JoinClassModal`, `CreateCourseModal`, `CourseListPage`, `CourseDetailPage`, `MyCoursesPage`.
  - Màn hình học tập `LearningPage`: Tích hợp trình phát video YouTube iframe responsive / HTML5 video, bài đọc Article, xem tài liệu PDF và Sidebar giáo trình đánh dấu tiến độ thời gian thực.
  - Kiểm thử: 12/12 JUnit5 tests pass, script tự động `deploy/verify_phase3.js` đạt 12/12 tiêu chí 100%.

- [x] **Giai đoạn 4: Hệ thống Trắc nghiệm & Chấm điểm tự động [HOÀN THÀNH 100%]**
  - Backend Entities & Repositories: `Quiz`, `QuizQuestion`, `QuizOption`, `QuizAttempt`, `QuizAnswer`, `QuestionType` (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`), `QuizAttemptStatus`.
  - CRUD Quizzes, câu hỏi và lựa chọn; bảo vệ phân quyền RBAC (`LECTURER`, `ADMIN`).
  - API bắt đầu thi: khởi tạo lượt thi `QuizAttempt`, tính thời gian làm bài, bảo mật tuyệt đối ẩn đáp án đúng `isCorrect` và `explanation` khi giao đề cho học viên.
  - Tự động chấm điểm trên server (Server-side Auto Grading): so khớp đáp án chính xác cho cả 3 dạng câu hỏi (Single, Multiple, True/False), quy đổi thang điểm 100, đánh giá Đạt/Không đạt.
  - Xem kết quả chi tiết kèm đối chiếu câu đúng/sai và lời giải thích chi tiết (`explanation`).
  - Thống kê phổ điểm giảng viên và xuất báo cáo kết quả thi ra file CSV hỗ trợ Excel (UTF-8 BOM).
  - Frontend: `QuizTakingPage` (giao diện thi chuyên nghiệp, countdown timer thời gian thực, cảnh báo thời gian, auto-submit khi hết giờ, palette mục lục câu hỏi), `QuizResultPage` (score badge, review đáp án & giải thích), `QuizStatisticsModal` (phổ điểm & xuất CSV), tích hợp Quiz vào `CourseDetailPage` và Sidebar của `LearningPage`.
  - Kiểm thử: 17/17 JUnit5 tests pass, script tự động `deploy/verify_phase4.js` đạt 10/10 tiêu chí 100%.

- [x] **Giai đoạn 5: Diễn đàn Thảo luận theo bài học & Chat nhóm [HOÀN THÀNH 100%]**
  - Backend Entities & Repositories: `Discussion`, `DiscussionComment` (Nested comments tree `parent_id`), `ChatMessage`.
  - Cấu hình Spring WebSocket STOMP `/ws` (kèm JWT ChannelInterceptor xác thực `Authorization: Bearer <token>`), broker topic `/topic/course/{courseId}/chat`.
  - Nghiệp vụ Diễn đàn: Thảo luận theo khóa học và lọc theo bài giảng; Cây bình luận đa tầng lồng nhau (Tree structure); Đánh dấu câu trả lời đúng được chấp nhận (`is_accepted_answer`); Giảng viên ghim bài thảo luận lên đầu (`is_pinned`).
  - Chat nhóm thời gian thực: REST API lấy lịch sử tin nhắn, WebSocket broadcast tin nhắn tức thời với đầy đủ thông tin thành viên (tên, avatar, role badge).
  - Phân quyền RBAC: Học viên chưa tham gia khóa học bị chặn gửi tin nhắn chat và tạo thảo luận.
  - Frontend: `DiscussionTab` (lọc theo bài học / khóa học, tạo thảo luận, badges), `DiscussionDetailModal` (cây bình luận thụt lề, nút reply, duyệt câu trả lời đúng), `GroupChatWidget` (widget chat nổi góc màn hình kết nối STOMP `@stomp/stompjs` thời gian thực).
  - Kiểm thử: JUnit5 unit tests, script tự động `deploy/verify_phase5.js` đạt 11/11 tiêu chí 100%.

- [x] **Giai đoạn 6: Lớp học trực tuyến Video Call WebRTC Mesh [HOÀN THÀNH 100%]**
  - Backend Entities & DTOs: `VideoRoom`, `VideoRoomRepository`, `VideoRoomResponse`, `CreateVideoRoomRequest`, `IceServerConfig`, `SignalMessage`.
  - Cấu hình STUN/TURN miễn phí (Google STUN: `stun:stun.l.google.com:19302`), REST API tạo phòng, đóng phòng, kiểm tra trạng thái phòng học.
  - WebRTC STOMP Signaling Controller: `/app/webrtc/{roomCode}/signal` -> broadcast `/topic/room/{roomCode}/signal`.
  - Frontend WebRTC Custom Hook `useWebRTC`: Khởi tạo media stream (kèm dummy fallback test), STOMP signaling cho Mesh topology (`JOIN`, `OFFER`, `ANSWER`, `ICE_CANDIDATE`, `LEAVE`, `TOGGLE_MEDIA`, `HAND_RAISE`, `CHAT`).
  - Giao diện phòng học trực tiếp `VideoRoomPage` (`/rooms/:roomCode`): Grid hiển thị video tự động thích ứng, chế độ toàn màn hình, điều khiển Mic/Cam/Chia sẻ màn hình, giơ tay phát biểu, hộp thoại chat nhanh trong phòng học.
  - Tích hợp mục "Lớp học trực tuyến Video Call" vào `CourseDetailPage` cho phép tham gia và mở phòng học tức thì.
  - Kiểm thử: Script tự động `deploy/verify_phase6.js` đạt 17/17 tiêu chí 100%, frontend build pass.

- [x] **Giai đoạn 7: Thông báo thời gian thực & Dashboard Thống kê [HOÀN THÀNH 100%]**
  - Backend Entities & Repositories: `Notification`, `NotificationRepository`, `NotificationResponse`, `StudentDashboardResponse`, `LecturerDashboardResponse`.
  - Hệ thống Thông báo: Phân loại thông báo, đếm số lượng chưa đọc, đánh dấu đã đọc một hoặc tất cả; gửi thông báo cá nhân qua WebSocket STOMP `/topic/notifications/user/{userId}`.
  - Dashboard API: Thống kê học tập cho Học viên (tiến độ khóa học, số bài học đã học, điểm trắc nghiệm trung bình, bài thi gần nhất); Thống kê giảng dạy cho Giảng viên (tổng khóa học, tổng học viên, top khóa học hot nhất, thảo luận mới cần phản hồi).
  - Phân quyền RBAC bảo vệ Dashboard Giảng viên (HTTP 403 cho Học viên).
  - Frontend: `NotificationDropdown` trên `Navbar` cập nhật WebSocket tức thì, badge chuông rung, `DashboardPage` hiển thị đồ họa trực quan và chỉ số phân tích.
  - Kiểm thử: Script tự động `deploy/verify_phase7.js` đạt 19/19 tiêu chí 100%.

- [x] **Giai đoạn 8: Hoàn thiện UI/UX, Dark mode & Animation [HOÀN THÀNH 100%]**
  - Đồng bộ Dark Mode / Light Mode toàn diện cho tất cả các trang, modals, tabs, dropdowns.
  - Tối ưu hóa giao diện người dùng Responsive hoàn toàn trên desktop, tablet và mobile.
  - Vi chỉnh hiệu ứng micro-animations, transitions mượt mà, typography sắc nét.
  - Kiểm tra và đảm bảo TypeScript sạch 100% lỗi (`npm run build` thành công).

- [x] **Giai đoạn 9: Đóng gói Docker Compose Production & Hướng dẫn sử dụng [HOÀN THÀNH 100%]**
  - `deploy/backend/Dockerfile`: Multi-stage build JDK 21 -> JRE 21 alpine slim, user phi đặc quyền, tối ưu RAM JVM.
  - `deploy/frontend/Dockerfile`: Multi-stage build Node 20 -> Nginx 1.25 alpine nhẹ.
  - `deploy/nginx/nginx.conf`: Nginx reverse proxy chuẩn cho Single Page App, REST API, WebSocket STOMP (`Upgrade` header), Gzip và cache static assets.
  - `docker-compose.prod.yml`: Khởi chạy toàn bộ hệ thống (PostgreSQL 16 + Backend Spring Boot + Frontend Nginx) chỉ với 1 lệnh duy nhất.
  - `README.md`: Tài liệu hướng dẫn sử dụng, bảng tài khoản demo, mô tả chi tiết từng tính năng và hướng dẫn chạy script kiểm thử tự động.
