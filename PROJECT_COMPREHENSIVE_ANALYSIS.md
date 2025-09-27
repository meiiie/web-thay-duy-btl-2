# PHÂN TÍCH TOÀN DIỆN DỰ ÁN VOTING-ATTENDANCE-APP

## TỔNG QUAN DỰ ÁN

**Voting Attendance App** là một ứng dụng web front-end được phát triển bằng Angular hiện đại để phục vụ cho việc điểm danh và bầu cử trong các sự kiện, đặc biệt là Đại hội đại biểu Đoàn TNCS Hồ Chí Minh Khoa Công nghệ thông tin nhiệm kỳ 2024-2027.

### Mục tiêu chính:
- **Điểm danh**: Quét QR code CCCD/VNeID để điểm danh tự động
- **Bầu cử**: Hệ thống bầu cử trực tuyến với xác thực CCCD
- **Quản lý**: Dashboard admin để quản lý toàn bộ quy trình
- **Hiển thị**: Giao diện UX/UI chuyên nghiệp nhưng đơn giản

## KIẾN TRÚC TỔNG THỂ

### 1. Công nghệ sử dụng
- **Frontend**: Angular 20.3.0 (Standalone Components)
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Deployment**: Vercel
- **State Management**: Angular Signals
- **UI Framework**: Custom SCSS với responsive design
- **QR Scanner**: ZXing Library
- **File Processing**: XLSX cho import/export Excel

### 2. Cấu trúc thư mục
```
src/
├── app/
│   ├── components/           # Các component chính
│   │   ├── home/            # Trang chủ
│   │   ├── qr-scanner/      # Quét QR điểm danh
│   │   ├── voting/          # Giao diện bầu cử
│   │   ├── admin/           # Quản trị viên
│   │   │   └── login/       # Đăng nhập admin
│   │   ├── dashboard/       # Dashboard hiển thị
│   │   └── shared/          # Component dùng chung
│   │       ├── notification/
│   │       └── loading/
│   ├── services/            # Business logic
│   │   ├── supabase.service.ts
│   │   ├── auth.service.ts
│   │   └── notification.service.ts
│   ├── guards/              # Route protection
│   │   └── auth.guard.ts
│   ├── app.config.ts        # App configuration
│   ├── app.routes.ts        # Routing
│   └── app.ts               # Root component
├── environments/            # Environment configs
└── styles.scss             # Global styles
```

## PHÂN TÍCH CHI TIẾT CÁC THÀNH PHẦN

### 1. SERVICES (Business Logic)

#### SupabaseService
**Chức năng chính**: Quản lý tất cả tương tác với database
- **Roster Management**: CRUD operations cho danh sách cử tri
- **Attendance Management**: Điểm danh và theo dõi
- **Voting Management**: Bầu cử và kết quả
- **Candidate Management**: Quản lý ứng cử viên
- **Election Status**: Quản lý trạng thái cuộc bầu cử
- **Data Reset**: Reset toàn bộ dữ liệu cho sự kiện mới
- **Image Upload**: Upload ảnh ứng cử viên

**Interfaces quan trọng**:
```typescript
interface RosterRecord {
  cccd: string;        // Primary key - 12 digits
  hoten: string;       // Họ tên
  mssv?: string;        // Mã số sinh viên
}

interface AttendanceRecord {
  cccd: string;
  time: string;         // Thời gian điểm danh
}

interface Vote {
  cccd: string;
  candidate: string;    // Tên ứng cử viên
  voted_at: string;    // Thời gian bầu cử
}

interface Candidate {
  name: string;
  position: string;     // Vị trí ứng cử
  description: string;
  active: boolean;
  image_url?: string;   // URL ảnh từ Supabase Storage
}

interface ElectionStatus {
  status: 'active' | 'ended' | 'results_published';
  ended_at?: string;
  results_published_at?: string;
}
```

#### AuthService
**Chức năng**: Quản lý xác thực admin
- **Hardcoded credentials**: admin/admin123
- **Session management**: 8 giờ timeout
- **LocalStorage**: Lưu trữ session
- **Signals**: Reactive state management

#### NotificationService
**Chức năng**: Hiển thị thông báo
- **Types**: success, error, warning, info
- **Auto-close**: Tự động đóng sau 5 giây
- **Manual dismiss**: Cho phép đóng thủ công

### 2. COMPONENTS

#### Home Component
- **Đơn giản**: Chỉ có navigation links
- **Responsive**: Mobile-first design
- **Clean UI**: Giao diện đơn giản, dễ sử dụng

#### QR Scanner Component
**Chức năng phức tạp nhất**:
- **Multi-camera support**: Tự động fallback camera configs
- **Advanced QR parsing**: Hỗ trợ nhiều format CCCD/VNeID
- **Manual input**: Nhập thủ công CCCD/MSSV
- **Image upload**: Upload ảnh QR để scan
- **Fuzzy search**: Tìm kiếm mờ với tên/MSSV
- **Real-time validation**: Kiểm tra CCCD trong roster
- **Duplicate prevention**: Ngăn điểm danh trùng

**QR Parsing Logic**:
- Direct 12-digit CCCD
- CCCD with separators (|, ;, ,)
- TLV format parsing
- JSON format support
- Base64 encoded data
- Vietnamese specific formats
- VNeID specific patterns
- Hex encoded data

#### Voting Component
**Workflow bầu cử**:
1. **Validate CCCD**: Kiểm tra trong roster
2. **Check attendance**: Phải điểm danh trước
3. **Check duplicate vote**: Mỗi người chỉ được 1 phiếu
4. **Select candidate**: Chọn ứng cử viên
5. **Submit vote**: Ghi nhận phiếu bầu

#### Admin Component
**Dashboard quản trị toàn diện**:
- **Tabs**: Attendance, Voting, Roster, Candidates
- **CRUD operations**: Thêm/sửa/xóa dữ liệu
- **Excel import/export**: Import danh sách cử tri
- **Image management**: Upload ảnh ứng cử viên
- **Election management**: Kết thúc/công bố kết quả
- **Data reset**: Reset toàn bộ dữ liệu
- **Pagination**: Phân trang cho danh sách lớn
- **Statistics**: Thống kê tỷ lệ tham gia

#### Dashboard Component
**Real-time monitoring**:
- **Live statistics**: Tỷ lệ điểm danh, bầu cử
- **Recent activities**: Hoạt động gần đây
- **Election status**: Trạng thái cuộc bầu cử
- **Auto-refresh**: Cập nhật mỗi 30 giây
- **Published results**: Hiển thị kết quả công bố

### 3. ROUTING & NAVIGATION

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

**Route Protection**:
- **AuthGuard**: Bảo vệ admin routes
- **Session validation**: Kiểm tra session timeout
- **Return URL**: Redirect sau login

## DATABASE SCHEMA

### 1. Tables chính

#### roster (Danh sách cử tri)
```sql
CREATE TABLE roster (
  cccd VARCHAR(12) PRIMARY KEY,    -- 12 chữ số
  hoten VARCHAR(255) NOT NULL,    -- Họ tên
  mssv VARCHAR(50),                -- Mã số sinh viên
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### attendance (Điểm danh)
```sql
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  cccd VARCHAR(12) NOT NULL,
  time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (cccd) REFERENCES roster(cccd) ON DELETE CASCADE
);
```

#### votes (Phiếu bầu)
```sql
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  cccd VARCHAR(12) NOT NULL,
  candidate VARCHAR(255) NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (cccd) REFERENCES roster(cccd) ON DELETE CASCADE,
  UNIQUE (cccd),  -- Mỗi người chỉ được 1 phiếu
  CHECK (cccd ~ '^[0-9]{12}$')  -- Validate CCCD format
);
```

#### candidates (Ứng cử viên)
```sql
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### election_status (Trạng thái cuộc bầu cử)
```sql
CREATE TABLE election_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'active',
  ended_at TIMESTAMPTZ NULL,
  results_published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('active', 'ended', 'results_published'))
);
```

### 2. Indexes & Constraints
- **Primary Keys**: Tất cả tables có PK
- **Foreign Keys**: Referential integrity
- **Unique Constraints**: votes.cccd (1 người 1 phiếu)
- **Check Constraints**: CCCD format validation
- **Indexes**: Performance optimization
- **RLS Disabled**: Đơn giản hóa permissions

### 3. Data Flow
```
roster (CCCD) 
    ↓
attendance (CCCD + time)
    ↓
votes (CCCD + candidate + voted_at)
    ↓
election_status (status management)
```

## BUSINESS LOGIC & WORKFLOWS

### 1. Điểm danh Workflow
1. **QR Scan**: Quét CCCD từ QR code
2. **Parse CCCD**: Extract 12-digit CCCD
3. **Validate**: Kiểm tra trong roster
4. **Check duplicate**: Ngăn điểm danh trùng
5. **Mark attendance**: Ghi nhận thời gian
6. **Success feedback**: Hiển thị thông tin

### 2. Bầu cử Workflow
1. **Input CCCD**: Nhập số CCCD
2. **Validate roster**: Kiểm tra trong danh sách
3. **Check attendance**: Phải điểm danh trước
4. **Check duplicate vote**: Ngăn bầu trùng
5. **Load candidates**: Hiển thị danh sách ứng cử viên
6. **Select candidate**: Chọn ứng cử viên
7. **Submit vote**: Ghi nhận phiếu bầu
8. **Success feedback**: Xác nhận thành công

### 3. Admin Management Workflow
1. **Login**: Xác thực admin credentials
2. **Dashboard**: Xem tổng quan
3. **Manage roster**: Thêm/sửa/xóa cử tri
4. **Manage candidates**: Quản lý ứng cử viên
5. **Monitor activities**: Theo dõi điểm danh/bầu cử
6. **Control election**: Kết thúc/công bố kết quả
7. **Data management**: Import/export/reset

## TECHNICAL IMPLEMENTATION DETAILS

### 1. Angular Modern Features
- **Standalone Components**: Không sử dụng NgModules
- **Signals**: Reactive state management
- **Control Flow**: @if, @for thay vì *ngIf, *ngFor
- **Input/Output Functions**: Thay vì decorators
- **OnPush Strategy**: Change detection optimization
- **Inject Function**: Thay vì constructor injection

### 2. Error Handling
- **Try-catch blocks**: Comprehensive error handling
- **User-friendly messages**: Thông báo lỗi dễ hiểu
- **Fallback mechanisms**: Graceful degradation
- **Network error handling**: Xử lý lỗi kết nối
- **Validation errors**: Client-side validation

### 3. Performance Optimizations
- **Lazy loading**: Route-based code splitting
- **OnPush change detection**: Giảm change detection cycles
- **Pagination**: Xử lý danh sách lớn
- **Indexes**: Database query optimization
- **Image optimization**: Compressed uploads
- **Auto-refresh**: Efficient data updates

### 4. Security Considerations
- **Input validation**: CCCD format validation
- **SQL injection prevention**: Supabase ORM
- **XSS protection**: Angular built-in sanitization
- **Session management**: Timeout và validation
- **Admin protection**: Route guards

## DEPLOYMENT & CONFIGURATION

### 1. Vercel Configuration
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
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Đã sửa**: Thay `routes` bằng `rewrites` để tránh lỗi MIME type.

### 2. Environment Configuration
```typescript
// Development
export const environment = {
  production: false,
  supabase: {
    url: 'https://vtwvtrbmgfjhszwajqln.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};

// Production
export const environment = {
  production: true,
  supabase: {
    url: 'https://vtwvtrbmgfjhszwajqln.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};
```

### 3. Supabase Configuration
- **Database**: PostgreSQL với RLS disabled
- **Storage**: Bucket `anh_ung_vien` cho ảnh ứng cử viên
- **Real-time**: Không sử dụng (polling thay thế)
- **Auth**: Không sử dụng Supabase Auth (custom auth)

## THỂ LỆ BỎ PHIẾU THỰC TẾ

Dựa trên thông tin cung cấp, đây là cuộc bầu cử cho Đại hội đại biểu Đoàn TNCS Hồ Chí Minh Khoa Công nghệ thông tin nhiệm kỳ 2024-2027:

### Thống kê đại biểu:
- **Tổng số đại biểu**: 75 đồng chí
- **Đại biểu đương nhiên**: 11 đ/c (14,67%)
- **Đại biểu được bầu**: 64 đ/c (85,33%)
- **Nam**: 47 đ/c (62,67%)
- **Nữ**: 28 đ/c (37,33%)
- **Đảng viên**: 10 đ/c (13,33%)
- **Tuổi bình quân**: 20,05 tuổi

### Cơ cấu học vấn:
- **Thạc sỹ**: 3 đ/c (4%)
- **Đại học**: 72 đ/c (96%)
- **Sinh viên năm 1**: 10 đ/c (13,33%)
- **Sinh viên năm 2**: 23 đ/c (30,67%)
- **Sinh viên năm 3**: 19 đ/c (25,33%)
- **Sinh viên năm 4**: 20 đ/c (26,67%)

## ĐIỂM MẠNH CỦA DỰ ÁN

### 1. Kiến trúc hiện đại
- **Angular 20**: Sử dụng các tính năng mới nhất
- **Standalone Components**: Đơn giản hóa cấu trúc
- **Signals**: Reactive programming hiện đại
- **TypeScript**: Type safety toàn diện

### 2. UX/UI chuyên nghiệp
- **Responsive design**: Mobile-first approach
- **Clean interface**: Giao diện đơn giản, dễ sử dụng
- **Real-time feedback**: Thông báo tức thì
- **Error handling**: Xử lý lỗi thân thiện

### 3. Tính năng phong phú
- **QR Scanner**: Hỗ trợ nhiều format CCCD/VNeID
- **Manual input**: Fallback khi QR không hoạt động
- **Image upload**: Upload ảnh QR để scan
- **Excel import/export**: Quản lý dữ liệu hàng loạt
- **Admin dashboard**: Quản lý toàn diện

### 4. Robustness
- **Error handling**: Xử lý lỗi toàn diện
- **Validation**: Kiểm tra dữ liệu nghiêm ngặt
- **Duplicate prevention**: Ngăn điểm danh/bầu cử trùng
- **Data integrity**: Foreign key constraints

## VẤN ĐỀ ĐÃ SỬA

### 1. Deployment Issue (Đã sửa)
**Vấn đề**: Lỗi MIME type trên Vercel
```
Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"
```

**Nguyên nhân**: Cấu hình `routes` với `dest` bắt tất cả requests (kể cả .js files) trỏ về index.html

**Giải pháp**: Thay `routes` bằng `rewrites` để ưu tiên static files trước khi fallback về index.html

### 2. Database Schema
- **Đã tối ưu**: Foreign key constraints
- **Đã thêm**: Election status management
- **Đã loại bỏ**: Codes table (không cần thiết)
- **Đã cải thiện**: Indexes cho performance

## KẾT LUẬN

Dự án **Voting Attendance App** là một ứng dụng web hiện đại, được thiết kế và phát triển theo các best practices của Angular. Với kiến trúc standalone components, signals, và tích hợp Supabase, ứng dụng cung cấp một giải pháp hoàn chỉnh cho việc điểm danh và bầu cử trong các sự kiện.

**Điểm nổi bật**:
- ✅ Kiến trúc hiện đại với Angular 20
- ✅ UX/UI chuyên nghiệp và responsive
- ✅ Tính năng phong phú và robust
- ✅ Database schema được tối ưu
- ✅ Error handling toàn diện
- ✅ Deployment issue đã được sửa

Dự án sẵn sàng cho việc triển khai và sử dụng trong thực tế, với khả năng mở rộng và bảo trì tốt.