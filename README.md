# 🎓 EduLive - Nền tảng Học trực tuyến Thông minh & Tương tác Thời gian thực

> **Đồ án môn học Công nghệ Phần mềm / Phát triển Ứng dụng Web Full-stack**  
> Kiến trúc Monorepo độc lập: **Spring Boot 3 (Java 21)** + **React SPA (TypeScript & Vite)** + **PostgreSQL 16** + **WebRTC Mesh Video Call** + **STOMP WebSocket** + **Docker Compose**.

---

## 📑 Bảng Mục Lục
1. [Giới thiệu Dự án](#1-giới-thiệu-dự-án)
2. [Ngăn xếp Công nghệ (Tech Stack)](#2-ngăn-xếp-công-nghệ-tech-stack)
3. [Kiến trúc & Cấu trúc Thư mục Monorepo](#3-kiến-trúc--cấu-trúc-thư-mục-monorepo)
4. [Tài khoản Demo Thử nghiệm](#4-tài-khoản-demo-thử-nghiệm)
5. [Hướng dẫn Khởi chạy](#5-hướng-dẫn-khởi-chạy)
   - [Cách 1: Khởi chạy 1 lệnh bằng Docker Compose (Khuyên dùng)](#cách-1-chạy-toàn-bộ-bằng-docker-compose-production)
   - [Cách 2: Khởi chạy môi trường Phát triển cục bộ (Development)](#cách-2-chạy-môi-trường-phát-triển-local-dev)
6. [Các Tính năng Nổi bật](#6-các-tính-năng-nổi-bật)
7. [Tài liệu API (Swagger UI) & Kiểm thử Tự động](#7-tài-liệu-api-swagger-ui--kiểm-thử-tự-động)

---

## 1. Giới thiệu Dự án
**EduLive** là nền tảng học trực tuyến hiện đại kết hợp những ưu điểm tốt nhất của:
- **Coursera**: Lộ trình bài giảng video chuẩn mực, bài kiểm tra trắc nghiệm tính giờ, theo dõi % hoàn thành khóa học.
- **Google Classroom**: Mã lớp học 6 ký tự để tham gia nhanh, thông báo khóa học, thảo luận bài giảng lồng nhau.
- **Zoom / Google Meet**: Phòng học trực tuyến Video Call P2P Mesh thời gian thực, bật/tắt camera/micro, chia sẻ màn hình, giơ tay phát biểu và hộp thoại lớp học trực tiếp.

Toàn bộ ứng dụng sử dụng giao diện Tiếng Việt, hỗ trợ **Dark Mode / Light Mode**, thiết kế Responsive tương thích máy tính bảng và điện thoại di động, **không sử dụng bất kỳ dịch vụ tính phí hoặc API key bên ngoài nào**.

---

## 2. Ngăn xếp Công nghệ (Tech Stack)

### Backend (Spring Boot 3)
- **Java 21**, **Spring Boot 3.3.4**
- **Spring Security 6** + **JWT (JSON Web Token)** với cơ chế Access Token & Refresh Token, mã hóa mật khẩu chuẩn **BCrypt**.
- **Spring Data JPA** & **Hibernate** kết nối PostgreSQL.
- **Flyway Database Migration**: Tự động đồng bộ cấu trúc bảng và nạp dữ liệu mẫu ban đầu (Seed data).
- **Spring WebSocket STOMP**: Giao thức truyền tin thời gian thực cho Chat nhóm, WebRTC Signaling và Thông báo đẩy.
- **Springdoc OpenAPI (Swagger 3)**: Sinh tài liệu API trực quan và giao diện test API tương tác.

### Frontend (React SPA)
- **React 18**, **TypeScript**, **Vite** (Build cực nhanh, Hot Module Replacement).
- **TailwindCSS** + **Lucide Icons**: Giao diện sắc nét, Glassmorphism, chuẩn thiết kế hiện đại.
- **WebRTC Native API**: `RTCPeerConnection`, `navigator.mediaDevices.getUserMedia`, `getDisplayMedia` (Chia sẻ màn hình) kết nối Mesh ngang hàng không qua máy chủ trung gian.
- **@stomp/stompjs**: Kết nối WebSocket 2 chiều bền vững.
- **Context API & Custom Hooks**: `AuthContext`, `useWebRTC`.

### Cơ sở dữ liệu & Triển khai
- **PostgreSQL 16**: Quản lý quan hệ chặt chẽ, tối ưu index, khóa ngoại, sequence.
- **Docker & Docker Compose**: Đóng gói multi-stage build, Nginx Alpine Reverse Proxy.

---

## 3. Kiến trúc & Cấu trúc Thư mục Monorepo

```
Edulive/
├── backend/                       # Ứng dụng Spring Boot 3
│   ├── src/main/java/com/edulive/
│   │   ├── config/               # Cấu hình Security, CORS, WebSocket, Swagger
│   │   ├── controller/           # REST Controllers & STOMP Signaling Controller
│   │   ├── dto/                  # Request, Response DTOs
│   │   ├── entity/               # JPA Entities (User, Course, Quiz, VideoRoom, Notification...)
│   │   ├── exception/            # Global Exception Handler
│   │   ├── repository/           # Spring Data JPA Repositories
│   │   ├── security/             # JWT Filter, UserPrincipal, Token Provider
│   │   └── service/              # Nghiệp vụ logic chính
│   ├── src/main/resources/
│   │   ├── db/migration/         # Script Flyway (V1__init_schema.sql, V2__seed_data.sql)
│   │   └── application.yml       # Cấu hình môi trường
│   ├── pom.xml
│   └── mvnw.cmd / mvnw
│
├── frontend/                      # Ứng dụng React 18 + Vite SPA
│   ├── src/
│   │   ├── components/           # Components dùng chung (Layout, Navbar, Chat, Quiz, Discussion)
│   │   ├── context/              # AuthContext quản lý phiên đăng nhập
│   │   ├── hooks/                # Custom hooks (useWebRTC Mesh Signaling)
│   │   ├── pages/                # Các trang chính (Home, CourseDetail, Learning, Quiz, Room, Dashboard...)
│   │   ├── services/             # Axios API clients & WebSocket services
│   │   └── types/                # TypeScript Interfaces & Types
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── deploy/                        # Cấu hình triển khai & Kiểm thử tự động
│   ├── backend/Dockerfile         # Multi-stage build JDK 21 -> JRE 21 slim
│   ├── frontend/Dockerfile        # Multi-stage build Node 20 -> Nginx Alpine
│   ├── nginx/nginx.conf           # Cấu hình Nginx Reverse Proxy (SPA + REST + WebSockets)
│   ├── verify_phase2.js           # Script test tự động Auth & RBAC
│   ├── verify_phase3.js           # Script test tự động Khóa học & Tiến độ
│   ├── verify_phase4.js           # Script test tự động Trắc nghiệm & Chấm điểm
│   ├── verify_phase5.js           # Script test tự động Thảo luận & Chat nhóm
│   ├── verify_phase6.js           # Script test tự động Video Call WebRTC
│   └── verify_phase7.js           # Script test tự động Thông báo & Dashboard
│
├── docker-compose.prod.yml        # Docker compose production 1 lệnh chạy toàn bộ
├── docs/IMPLEMENTATION_PLAN.md    # Bản kế hoạch chi tiết 9 giai đoạn
└── README.md                      # Tài liệu dự án
```

---

## 4. Tài khoản Demo Thử nghiệm

Tất cả tài khoản mẫu đã được cấu hình mật khẩu mặc định là: `Password@123`

| Vai trò (Role) | Họ và tên | Email đăng nhập | Mật khẩu | Quyền hạn tiêu biểu |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Quản trị viên EduLive | `admin@edulive.vn` | `Password@123` | Toàn quyền hệ thống, xem mọi dữ liệu |
| **LECTURER** | ThS. Trần Quang Vinh | `giangvien1@edulive.vn` | `Password@123` | Tạo khóa học, tạo đề trắc nghiệm, mở phòng Video Call, thống kê phổ điểm |
| **LECTURER** | TS. Lê Hoàng Nam | `giangvien2@edulive.vn` | `Password@123` | Giảng viên phụ trách khóa học Lập trình Web |
| **STUDENT** | Phạm Minh Anh | `hocvien1@edulive.vn` | `Password@123` | Đăng ký học, nộp bài trắc nghiệm, vào phòng WebRTC, hỏi đáp diễn đàn |
| **STUDENT** | Nguyễn Quốc Bảo | `hocvien2@edulive.vn` | `Password@123` | Học viên tương tác chat nhóm và trao đổi bài |

---

## 5. Hướng dẫn Khởi chạy

### Cách 1: Khởi chạy 1 Click bằng file BAT trên Windows (Nhanh nhất & Tiện lợi nhất)
Chỉ cần nhấp đúp (Double-click) vào các file script ở thư mục gốc của dự án:
- **`start.bat`**: Tự động kiểm tra PostgreSQL, khởi động Backend Spring Boot 3, khởi động Frontend Vite React và tự động mở trình duyệt vào `http://localhost:5173`.
- **`stop.bat`**: Tự động giải phóng cổng, dừng toàn bộ tiến trình Backend, Frontend và Docker một cách an toàn và sạch sẽ.

---

### Cách 2: Chạy toàn bộ bằng Docker Compose Production
Yêu cầu: Đã cài đặt Docker và Docker Compose trên máy tính.

Chỉ cần chạy **1 lệnh duy nhất** từ thư mục gốc của dự án:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Sau khi khởi chạy thành công:
- **Ứng dụng Web**: Truy cập `http://localhost` (Cổng 80)
- **Tài liệu Swagger API**: Truy cập `http://localhost/swagger-ui/index.html`
- **Backend API trực tiếp**: `http://localhost:8088`

Để dừng ứng dụng:
```bash
docker compose -f docker-compose.prod.yml down
```

---

### Cách 2: Chạy môi trường Phát triển Local (Development)

#### 1. Khởi động PostgreSQL
Khởi động container PostgreSQL qua file dev:
```bash
docker compose -f deploy/docker-compose.dev.yml up -d
```

#### 2. Khởi động Backend Spring Boot
Di chuyển vào thư mục `backend/` và khởi chạy với Maven Wrapper:
```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run

# Linux / MacOS:
./mvnw spring-boot:run
```
Backend sẽ lắng nghe tại cổng `http://localhost:8088`. Flyway sẽ tự động tạo bảng và nạp seed data mẫu.

#### 3. Khởi động Frontend React Vite
Mở một cửa sổ dòng lệnh khác, di chuyển vào thư mục `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`.

---

## 6. Các Tính năng Nổi bật

### 1. Quản lý Khóa học & Bài giảng đa phương tiện
- Phân chia khóa học theo Chương và Danh sách bài học.
- Đa dạng loại nội dung: Video (YouTube / Local MP4), Bài viết học tập (Article), Tài liệu (PDF), Bài kiểm tra (Quiz).
- Theo dõi tiến độ hoàn thành bài học, tự động tính % tiến độ và cấp chứng nhận hoàn thành.
- Tham gia nhanh qua Mã lớp học 6 ký tự (Ví dụ: `JAVA01`, `REACT1`).

### 2. Hệ thống Bài tập Trắc nghiệm & Chấm điểm Tự động
- Tự động xáo trộn và bảo mật: Ẩn cờ `isCorrect` và `explanation` khi giao đề cho học viên.
- Đồng hồ đếm ngược thời gian thực, tự động thu bài khi hết giờ.
- Máy chủ chấm điểm tự động chính xác từng câu hỏi, lưu lại toàn bộ lịch sử các lần thi.
- Bảng phân tích kết quả bài thi: Điểm số, Đạt/Không đạt, giải thích chi tiết cho từng câu hỏi.
- Phổ điểm & Thống kê dành cho Giảng viên kèm tính năng xuất báo cáo CSV UTF-8 tương thích Microsoft Excel.

### 3. Diễn đàn Thảo luận Lồng nhau (Nested Q&A) & Chat Nhóm STOMP
- Diễn đàn hỏi đáp gắn liền với từng bài giảng hoặc toàn bộ khóa học.
- Bình luận đa tầng dạng cây (Nested Tree Comments).
- Tính năng ghim bài viết quan trọng và Đánh dấu câu trả lời chính xác (`Accepted Answer`).
- Hộp thoại Chat nhóm thời gian thực qua giao thức STOMP WebSocket, lưu trữ lịch sử tin nhắn trong PostgreSQL.

### 4. Lớp học Trực tuyến Video Call WebRTC P2P Mesh
- Phòng học ảo thời gian thực không giới hạn thời lượng:
  - Bật/Tắt Micro và Video Camera mượt mà.
  - Chia sẻ toàn bộ màn hình hoặc cửa sổ làm việc (`getDisplayMedia`).
  - Nút giơ tay phát biểu (Raise Hand) thông báo trực quan cho giảng viên.
  - Hộp thoại tin nhắn tức thì bên trong phòng học (In-room chat).
  - Tự động thích ứng mạng với Google STUN miễn phí (`stun:stun.l.google.com:19302`).

### 5. Thông báo Thời gian thực & Dashboard Thống kê (Analytics)
- Chuông thông báo đẩy trên thanh điều hướng nhận tin nhắn WebSocket tức thời không cần tải lại trang.
- Đánh dấu đã đọc và chuyển hướng nhanh đến sự kiện liên quan.
- **Dashboard Học viên**: Báo cáo tổng số giờ học, số khóa học đã hoàn thành, điểm trung bình bài thi trắc nghiệm, các bài kiểm tra gần nhất.
- **Dashboard Giảng viên**: Thống kê số lượng học viên, điểm số trung bình toàn khóa, danh sách khóa học hàng đầu và các câu hỏi thảo luận mới nhất.

---

## 7. Tài liệu API (Swagger UI) & Kiểm thử Tự động

### Swagger UI Trực quan
Truy cập đường dẫn: **`http://localhost:8088/swagger-ui.html`** để xem danh sách hơn 30+ endpoints REST API chuẩn RESTful OpenAPI 3.0 với đầy đủ mô tả tham số và nút "Try it out".

### Bộ Kịch bản Kiểm thử Tự động (Verification Scripts)
Các file kiểm thử tự động độc lập được đặt trong thư mục `deploy/`:
- `node deploy/verify_phase2.js`: Kiểm thử Đăng ký, Đăng nhập, JWT Refresh Token, Phân quyền RBAC.
- `node deploy/verify_phase3.js`: Kiểm thử Danh mục, Tạo khóa học, Bài giảng, Đăng ký học, Đánh dấu hoàn thành bài học.
- `node deploy/verify_phase4.js`: Kiểm thử Sinh đề thi, Chấm điểm tự động, Ẩn đáp án, Phổ điểm và Xuất CSV.
- `node deploy/verify_phase5.js`: Kiểm thử Diễn đàn thảo luận lồng nhau, Chấp nhận câu trả lời và Chat nhóm WebSocket.
- `node deploy/verify_phase6.js`: Kiểm thử Tạo phòng học, Lấy ICE STUN config, Signaling và Đóng phòng WebRTC.
- `node deploy/verify_phase7.js`: Kiểm thử Thông báo cá nhân, Đánh dấu đã đọc, Dashboard Học viên và Giảng viên.

---

*Dự án được xây dựng với tình yêu công nghệ và tuân thủ các chuẩn mực phát triển phần mềm hiện đại.*
