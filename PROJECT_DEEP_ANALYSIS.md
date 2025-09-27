# PHÂN TÍCH SÂU DỰ ÁN VOTING-ATTENDANCE-APP

## TỔNG QUAN DỰ ÁN

**Tên dự án:** Voting Attendance App  
**Công nghệ:** Angular 20.3.0 (Standalone Components)  
**Backend:** Supabase (PostgreSQL)  
**Deployment:** Vercel  
**Mục đích:** Hệ thống điểm danh và bầu cử trực tuyến với QR Code CCCD/VNeID

## KIẾN TRÚC TỔNG THỂ

### 1. Cấu trúc Frontend (Angular)
```
src/
├── app/
│   ├── app.ts (Root Component)
│   ├── app.config.ts (Application Configuration)
│   ├── app.routes.ts (Routing Configuration)
│   ├── components/
│   │   ├── home/ (Trang chủ)
│   │   ├── qr-scanner/ (Quét QR Code)
│   │   ├── voting/ (Bầu cử)
│   │   ├── dashboard/ (Dashboard thống kê)
│   │   ├── admin/ (Quản trị)
│   │   └── shared/ (Components dùng chung)
│   ├── services/
│   │   ├── supabase.service.ts (Database operations)
│   │   ├── auth.service.ts (Authentication)
│   │   └── notification.service.ts (Notifications)
│   └── guards/
│       └── auth.guard.ts (Route protection)
├── environments/
│   ├── environment.ts (Development)
│   └── environment.prod.ts (Production)
└── styles.scss (Global styles)
```

### 2. Cấu trúc Database (Supabase)
```sql
-- Bảng chính
roster (Danh sách cử tri)
├── cccd VARCHAR(12) PRIMARY KEY
├── hoten VARCHAR(255)
├── mssv VARCHAR(255)
└── created_at TIMESTAMPTZ

attendance (Điểm danh)
├── id SERIAL PRIMARY KEY
├── cccd VARCHAR(12) REFERENCES roster(cccd)
├── time TIMESTAMPTZ
└── created_at TIMESTAMPTZ

votes (Phiếu bầu)
├── id SERIAL PRIMARY KEY
├── cccd VARCHAR(12) REFERENCES roster(cccd)
├── candidate VARCHAR(255)
├── voted_at TIMESTAMPTZ
└── created_at TIMESTAMPTZ

candidates (Ứng cử viên)
├── id SERIAL PRIMARY KEY
├── name VARCHAR(255)
├── position VARCHAR(255)
├── description TEXT
├── active BOOLEAN
├── image_url TEXT
└── created_at TIMESTAMPTZ

election_status (Trạng thái cuộc bầu cử)
├── id SERIAL PRIMARY KEY
├── status VARCHAR(50) ('active', 'ended', 'results_published')
├── ended_at TIMESTAMPTZ
├── results_published_at TIMESTAMPTZ
├── created_at TIMESTAMPTZ
└── updated_at TIMESTAMPTZ
```

## CHI TIẾT CÁC COMPONENT

### 1. Home Component (`src/app/components/home/`)
- **Chức năng:** Trang chủ giới thiệu hệ thống
- **Tính năng:** 
  - Hero section với thông tin hệ thống
  - Features grid hiển thị 3 tính năng chính
  - Hướng dẫn sử dụng step-by-step
  - Tech stack badges
- **UI/UX:** Responsive design với dark/light mode

### 2. QR Scanner Component (`src/app/components/qr-scanner/`)
- **Chức năng:** Quét QR Code từ CCCD/VNeID để điểm danh
- **Tính năng chính:**
  - Webcam scanning với ZXing library
  - Upload ảnh QR code
  - Nhập thủ công CCCD/MSSV
  - Xử lý đa định dạng QR (TLV, JSON, Base64, Hex)
  - Validation CCCD format (12 chữ số)
  - Kiểm tra trong danh sách roster
  - Kiểm tra trùng lặp điểm danh
- **Error Handling:** Comprehensive error messages với fallback options
- **Performance:** Multiple camera configurations với timeout handling

### 3. Voting Component (`src/app/components/voting/`)
- **Chức năng:** Bầu cử trực tuyến
- **Quy trình:**
  1. Nhập CCCD để xác thực
  2. Kiểm tra CCCD có trong roster
  3. Kiểm tra đã điểm danh chưa
  4. Kiểm tra đã bầu cử chưa
  5. Chọn ứng cử viên
  6. Submit phiếu bầu
- **Validation:** Multi-layer validation với clear error messages

### 4. Dashboard Component (`src/app/components/dashboard/`)
- **Chức năng:** Thống kê và báo cáo
- **Tính năng:** Real-time statistics, charts, export reports

### 5. Admin Component (`src/app/components/admin/`)
- **Chức năng:** Quản trị hệ thống
- **Tính năng:** 
  - CRUD operations cho candidates
  - Reset data operations
  - Election status management
  - Image upload cho candidates

## SERVICES VÀ BUSINESS LOGIC

### 1. SupabaseService (`src/app/services/supabase.service.ts`)
**Core Database Operations:**

#### Roster Operations
- `getRoster()`: Lấy danh sách cử tri
- `getRosterByCCCD(cccd)`: Tìm cử tri theo CCCD
- `searchRoster(query)`: Tìm kiếm fuzzy search
- `addRosterMember(member)`: Thêm cử tri mới

#### Attendance Operations
- `checkAttendance(cccd)`: Kiểm tra đã điểm danh chưa
- `markAttendance(cccd)`: Ghi nhận điểm danh
- `getAttendanceList()`: Danh sách điểm danh với thông tin roster

#### Voting Operations
- `submitVote(cccd, candidate)`: Submit phiếu bầu
- `getVotes()`: Lấy danh sách phiếu bầu
- `getVotingResults()`: Kết quả bầu cử với thống kê
- `getVotingStats()`: Thống kê số phiếu theo ứng cử viên

#### Candidates Operations
- `getCandidates()`: Lấy danh sách ứng cử viên active
- `addCandidate(candidate)`: Thêm ứng cử viên
- `updateCandidate(id, updates)`: Cập nhật ứng cử viên
- `deleteCandidate(id)`: Xóa ứng cử viên

#### Image Management
- `uploadCandidateImage(file, candidateId)`: Upload ảnh ứng cử viên
- `deleteCandidateImage(imageUrl)`: Xóa ảnh ứng cử viên

#### Election Status Management
- `getElectionStatus()`: Lấy trạng thái cuộc bầu cử
- `updateElectionStatus(status)`: Cập nhật trạng thái
- `resetElectionStatus()`: Reset về trạng thái active

#### Data Reset Operations
- `resetAllData()`: Xóa toàn bộ dữ liệu (cascade delete)
- `resetAttendanceData()`: Xóa dữ liệu điểm danh
- `resetVotingData()`: Xóa dữ liệu bầu cử
- `resetCandidatesData()`: Xóa dữ liệu ứng cử viên
- `resetRosterData()`: Xóa dữ liệu cử tri

### 2. AuthService (`src/app/services/auth.service.ts`)
**Authentication Management:**
- Hardcoded admin credentials (admin/admin123)
- Session management với localStorage
- Signal-based reactive state
- Session timeout (8 hours)
- Route protection integration

### 3. NotificationService (`src/app/services/notification.service.ts`)
**Notification System:**
- Toast notifications với multiple types
- Auto-close functionality
- Dismissible notifications
- Component-based architecture

## ROUTING VÀ NAVIGATION

```typescript
const routes: Routes = [
  { path: '', component: Home },
  { path: 'scan', component: QrScannerComponent },
  { path: 'voting', component: VotingComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/' }
];
```

## QUY TẮC PHÁT TRIỂN ANGULAR

### 1. Component Architecture
- **Standalone Components:** Tất cả components đều standalone
- **Signals:** Sử dụng signals cho state management
- **Change Detection:** OnPush strategy
- **Input/Output:** Sử dụng `input()` và `output()` functions
- **Computed:** Sử dụng `computed()` cho derived state

### 2. Template Best Practices
- **Control Flow:** Native control flow (`@if`, `@for`, `@switch`)
- **Binding:** Class và style bindings thay vì `ngClass`/`ngStyle`
- **Forms:** Reactive forms preferred
- **Images:** `NgOptimizedImage` cho static images

### 3. Service Design
- **Single Responsibility:** Mỗi service có một trách nhiệm rõ ràng
- **Dependency Injection:** Sử dụng `inject()` function
- **Singleton:** `providedIn: 'root'`

## VẤN ĐỀ DEPLOYMENT HIỆN TẠI

### 1. Nguyên nhân lỗi trang trắng
**Lỗi chính:** Platform mismatch của esbuild
```
Error: You installed esbuild for another platform than the one you're currently using.
Specifically the "@esbuild/win32-x64" package is present but this platform needs the "@esbuild/linux-x64" package instead.
```

**Nguyên nhân:** 
- Dự án được phát triển trên Windows
- Deploy trên Vercel (Linux environment)
- `node_modules` được copy từ Windows sang WSL2/Linux
- esbuild cần platform-specific binary

### 2. Giải pháp
```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Cài đặt lại dependencies trên Linux
npm install

# Build lại
npm run build
```

### 3. Cấu hình Vercel
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/voting-attendance-app/browser",
        "buildCommand": "npm run vercel-build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## THỂ LỆ BẦU CỬ

### Thông tin cuộc bầu cử
- **Tổng số đại biểu:** 75 đồng chí
- **Đại biểu đương nhiên:** 11 đ/c (14,67%)
- **Đại biểu được bầu:** 64 đ/c (85,33%)
- **Giới tính:** Nam 47 đ/c (62,67%), Nữ 28 đ/c (37,33%)
- **Đảng viên:** 10 đ/c (13,33%)
- **Tuổi bình quân:** 20,05 tuổi
- **Tuổi trẻ nhất:** 18 tuổi
- **Tuổi cao nhất:** 34 tuổi

### Quy trình bầu cử
1. **Điểm danh:** Quét QR CCCD/VNeID hoặc nhập thủ công
2. **Xác thực:** Kiểm tra CCCD trong danh sách roster
3. **Bầu cử:** Chọn ứng cử viên từ danh sách candidates
4. **Kết quả:** Thống kê real-time trên dashboard

## TÍNH NĂNG NỔI BẬT

### 1. QR Code Processing
- **Multi-format support:** TLV, JSON, Base64, Hex, Vietnamese formats
- **Advanced parsing:** 9 methods để extract CCCD từ QR text
- **Error handling:** Comprehensive error messages với fallback options
- **Performance:** Multiple camera configurations với timeout

### 2. Data Management
- **Cascade operations:** Proper foreign key handling
- **Reset functionality:** Complete data reset cho sự kiện mới
- **Image management:** Supabase Storage integration
- **Election status:** Real-time status management

### 3. Security & Validation
- **CCCD validation:** 12-digit format validation
- **Duplicate prevention:** Unique constraints
- **Session management:** 8-hour timeout
- **Route protection:** AuthGuard implementation

### 4. User Experience
- **Responsive design:** Mobile-first approach
- **Dark/Light mode:** Theme switching
- **Real-time feedback:** Status messages và notifications
- **Accessibility:** Proper ARIA labels và keyboard navigation

## KẾ HOẠCH PHÁT TRIỂN TIẾP THEO

### 1. Ưu tiên cao
- **Fix deployment issue:** Resolve esbuild platform mismatch
- **Error handling:** Improve error messages và user feedback
- **Performance:** Optimize QR scanning performance
- **Testing:** Add unit tests và integration tests

### 2. Tính năng mới
- **Real-time updates:** WebSocket integration cho live results
- **Export functionality:** PDF/Excel export cho reports
- **Audit trail:** Logging system cho security
- **Mobile app:** React Native hoặc Flutter app

### 3. Cải thiện UX/UI
- **Loading states:** Better loading indicators
- **Animations:** Smooth transitions và micro-interactions
- **Accessibility:** WCAG 2.1 compliance
- **Internationalization:** Multi-language support

## KẾT LUẬN

Dự án Voting Attendance App là một hệ thống hoàn chỉnh với:
- **Architecture:** Modern Angular với standalone components
- **Database:** Well-designed PostgreSQL schema với Supabase
- **Features:** Comprehensive QR scanning, voting, và admin functionality
- **Security:** Proper validation và authentication
- **UX:** Professional UI với responsive design

Vấn đề deployment hiện tại chỉ là platform mismatch của esbuild, có thể giải quyết dễ dàng bằng cách reinstall dependencies trên Linux environment.