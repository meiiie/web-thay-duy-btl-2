# Phân Tích Dự Án Voting Attendance App

## Tổng Quan Dự Án

**Voting Attendance App** là một ứng dụng web front-end được phát triển bằng Angular hiện đại để phục vụ cho việc điểm danh và bầu cử trong các sự kiện, đặc biệt là Đại hội đại biểu Đoàn TNCS Hồ Chí Minh Khoa Công nghệ thông tin nhiệm kỳ 2024-2027.

### Mục Đích Chính
- **Điểm danh**: Quét QR code CCCD/VNeID để điểm danh đại biểu
- **Bầu cử**: Cho phép đại biểu đã điểm danh bầu chọn ứng cử viên
- **Quản lý**: Giao diện admin để quản lý dữ liệu và theo dõi kết quả
- **Hiển thị**: Dashboard real-time hiển thị thống kê và hoạt động

## Kiến Trúc Hệ Thống

### Frontend Stack
- **Framework**: Angular 20.3.0 (Standalone Components)
- **Language**: TypeScript 5.9.2
- **Styling**: SCSS
- **State Management**: Angular Signals
- **QR Scanning**: @zxing/browser, qr-scanner
- **Excel Processing**: xlsx
- **Icons**: lucide-angular

### Backend Stack
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (đơn giản hóa với hardcoded admin)
- **Storage**: Supabase Storage (cho ảnh ứng cử viên)
- **API**: Supabase REST API

## Cấu Trúc Database

### Bảng Chính

#### 1. `roster` - Danh sách cử tri
```sql
- cccd VARCHAR(12) PRIMARY KEY  -- Số CCCD (12 chữ số)
- hoten VARCHAR(255) NOT NULL   -- Họ và tên
- mssv VARCHAR(50)              -- Mã số sinh viên
- created_at TIMESTAMPTZ        -- Thời gian tạo
```

#### 2. `attendance` - Điểm danh
```sql
- id SERIAL PRIMARY KEY         -- ID tự tăng
- cccd VARCHAR(12) NOT NULL     -- FK đến roster.cccd
- time TIMESTAMPTZ NOT NULL      -- Thời gian điểm danh
- created_at TIMESTAMPTZ         -- Thời gian tạo
```

#### 3. `votes` - Phiếu bầu
```sql
- id SERIAL PRIMARY KEY         -- ID tự tăng
- cccd VARCHAR(12) NOT NULL     -- FK đến roster.cccd
- candidate VARCHAR(255) NOT NULL -- Tên ứng cử viên
- voted_at TIMESTAMPTZ NOT NULL  -- Thời gian bầu cử
- created_at TIMESTAMPTZ         -- Thời gian tạo
```

#### 4. `candidates` - Ứng cử viên
```sql
- id SERIAL PRIMARY KEY         -- ID tự tăng
- name VARCHAR(255) NOT NULL    -- Tên ứng cử viên
- position VARCHAR(255) NOT NULL -- Vị trí ứng cử
- description TEXT              -- Mô tả
- active BOOLEAN DEFAULT true   -- Trạng thái hoạt động
- image_url TEXT                -- URL ảnh từ Supabase Storage
- created_at TIMESTAMP          -- Thời gian tạo
```

#### 5. `election_status` - Trạng thái cuộc bầu cử
```sql
- id SERIAL PRIMARY KEY         -- ID tự tăng
- status VARCHAR(50) NOT NULL   -- 'active', 'ended', 'results_published'
- ended_at TIMESTAMPTZ NULL     -- Thời gian kết thúc
- results_published_at TIMESTAMPTZ NULL -- Thời gian công bố kết quả
- created_at TIMESTAMPTZ        -- Thời gian tạo
- updated_at TIMESTAMPTZ        -- Thời gian cập nhật
```

### Ràng Buộc Foreign Key
- `attendance.cccd` → `roster.cccd` (CASCADE DELETE)
- `votes.cccd` → `roster.cccd` (CASCADE DELETE)
- Unique constraint: `votes.cccd` (mỗi người chỉ được bầu 1 lần)

## Cấu Trúc Component

### 1. App Component (`app.ts`)
- **Chức năng**: Root component với theme switching (dark/light mode)
- **State**: `isDarkMode` signal
- **Features**: LocalStorage persistence, system preference detection

### 2. Home Component (`home.ts`)
- **Chức năng**: Landing page đơn giản với navigation
- **Design**: Minimal, clean interface

### 3. QR Scanner Component (`qr-scanner.ts`)
- **Chức năng**: Quét QR code CCCD/VNeID để điểm danh
- **Features**:
  - Webcam access với multiple fallback configurations
  - Advanced QR parsing (TLV, JSON, Base64, Vietnamese formats)
  - Manual input fallback
  - Image upload for QR scanning
  - Comprehensive error handling
- **Validation**: CCCD format (12 digits), roster existence, duplicate attendance

### 4. Voting Component (`voting.ts`)
- **Chức năng**: Giao diện bầu cử cho đại biểu
- **Workflow**:
  1. Nhập CCCD
  2. Validate: có trong roster, đã điểm danh, chưa bầu cử
  3. Chọn ứng cử viên
  4. Submit vote
- **Security**: One vote per person constraint

### 5. Admin Component (`admin.ts`)
- **Chức năng**: Giao diện quản trị toàn diện
- **Features**:
  - **Roster Management**: CRUD operations, Excel import/export
  - **Candidate Management**: CRUD với image upload
  - **Election Management**: Start/end election, publish results
  - **Data Reset**: Individual hoặc complete reset
  - **Statistics**: Attendance rate, voting rate, real-time stats
  - **Export**: CSV export cho attendance và voting results

### 6. Dashboard Component (`dashboard.ts`)
- **Chức năng**: Real-time monitoring dashboard
- **Features**:
  - Live statistics (attendance, voting, participation rates)
  - Recent activities feed
  - Election status monitoring
  - Published results display
  - Auto-refresh every 30 seconds
  - System status indicators

### 7. Admin Login Component (`login.ts`)
- **Chức năng**: Simple authentication
- **Security**: Hardcoded credentials (admin/admin123)
- **Session**: 8-hour session với localStorage persistence

## Services Architecture

### 1. SupabaseService (`supabase.service.ts`)
- **Chức năng**: Central data access layer
- **Features**:
  - **Roster Operations**: CRUD, search, validation
  - **Attendance Operations**: Check, mark, list
  - **Voting Operations**: Submit, get results, statistics
  - **Candidate Operations**: CRUD với image management
  - **Election Status**: Get/update election state
  - **Data Reset**: Comprehensive reset operations
  - **Image Upload**: Supabase Storage integration

### 2. AuthService (`auth.service.ts`)
- **Chức năng**: Authentication management
- **Features**:
  - Simple login với hardcoded credentials
  - Session management với signals
  - Auto-logout sau 8 giờ
  - Route protection

### 3. NotificationService (`notification.service.ts`)
- **Chức năng**: Toast notification system
- **Features**: Success, error, warning, info notifications
- **Note**: Currently mock implementation

## Routing Structure

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

## Business Logic Flow

### 1. Điểm Danh Flow
```
QR Scan → Parse CCCD → Validate in Roster → Check Duplicate → Mark Attendance → Success
```

### 2. Bầu Cử Flow
```
Enter CCCD → Validate (Roster + Attendance + No Vote) → Select Candidate → Submit Vote → Success
```

### 3. Admin Management Flow
```
Login → Manage Data → Monitor Statistics → Control Election → Export Results
```

## Key Features

### 1. QR Code Processing
- **Advanced Parsing**: Hỗ trợ nhiều format QR (TLV, JSON, Base64, Vietnamese)
- **Fallback Options**: Manual input, image upload
- **Error Handling**: Comprehensive error messages với suggestions

### 2. Data Management
- **Excel Import**: Template-based import với validation
- **CSV Export**: Attendance và voting results
- **Bulk Operations**: Reset individual hoặc complete data

### 3. Real-time Monitoring
- **Live Statistics**: Auto-refresh dashboard
- **Activity Feed**: Recent attendance và voting activities
- **Status Indicators**: Database và QR scanner status

### 4. Election Control
- **Status Management**: Active → Ended → Results Published
- **Result Calculation**: Automatic vote counting và percentage
- **Winner Detection**: Automatic winner identification

## Security Considerations

### 1. Data Validation
- **CCCD Format**: Strict 12-digit validation
- **Duplicate Prevention**: Database constraints
- **Input Sanitization**: XSS prevention

### 2. Access Control
- **Admin Authentication**: Simple but functional
- **Route Protection**: AuthGuard implementation
- **Session Management**: Timeout và refresh

### 3. Data Integrity
- **Foreign Key Constraints**: Referential integrity
- **Transaction Safety**: Proper error handling
- **Backup Strategy**: Export functionality

## Performance Optimizations

### 1. Frontend
- **Standalone Components**: Reduced bundle size
- **OnPush Change Detection**: Optimized rendering
- **Signals**: Reactive state management
- **Lazy Loading**: Route-based code splitting

### 2. Backend
- **Database Indexes**: Optimized queries
- **Connection Pooling**: Supabase managed
- **Caching**: Browser caching cho static assets

## Error Handling

### 1. Network Errors
- **Retry Logic**: Automatic retry cho failed requests
- **Fallback UI**: Graceful degradation
- **User Feedback**: Clear error messages

### 2. Validation Errors
- **Client-side**: Immediate feedback
- **Server-side**: Database constraint validation
- **User Guidance**: Helpful error messages với suggestions

## Deployment Configuration

### 1. Environment Variables
```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://vtwvtrbmgfjhszwajqln.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};
```

### 2. Build Configuration
- **Angular CLI**: Modern build system
- **SCSS**: Component-scoped styling
- **Assets**: Public folder for static files

## Known Issues & Fixes

### 1. Reset Data Error (FIXED)
- **Problem**: UUID format used for integer SERIAL id columns
- **Solution**: Changed from `'00000000-0000-0000-0000-000000000000'` to `0`
- **Location**: `supabase.service.ts` reset methods

### 2. QR Scanner Compatibility
- **Issue**: Different camera configurations needed
- **Solution**: Multiple fallback configurations implemented

## Future Enhancements

### 1. Security Improvements
- **JWT Authentication**: Replace hardcoded credentials
- **Role-based Access**: Multiple admin levels
- **Audit Logging**: Track all admin actions

### 2. Feature Additions
- **Real-time Notifications**: WebSocket integration
- **Advanced Analytics**: Charts và graphs
- **Mobile Optimization**: PWA features
- **Multi-language**: i18n support

### 3. Performance
- **Caching Strategy**: Redis integration
- **CDN**: Static asset optimization
- **Database Optimization**: Query optimization

## Development Guidelines

### 1. Angular Best Practices
- **Standalone Components**: Preferred over NgModules
- **Signals**: Use for state management
- **OnPush**: Default change detection strategy
- **Reactive Forms**: Preferred over template-driven

### 2. Code Quality
- **TypeScript**: Strict type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Testing**: Unit tests (to be implemented)

### 3. Git Workflow
- **Feature Branches**: Isolated development
- **Code Reviews**: Quality assurance
- **CI/CD**: Automated testing và deployment

## Conclusion

Dự án Voting Attendance App là một ứng dụng web hiện đại được thiết kế tốt với kiến trúc rõ ràng và chức năng đầy đủ. Việc sử dụng Angular 20 với standalone components và signals cho thấy sự cập nhật với công nghệ mới nhất. Database schema được thiết kế hợp lý với proper foreign key constraints và business logic được implement đúng đắn.

Lỗi reset data đã được fix và hệ thống hiện tại hoạt động ổn định. Dự án có tiềm năng mở rộng tốt với các tính năng bổ sung như real-time notifications, advanced analytics, và enhanced security.