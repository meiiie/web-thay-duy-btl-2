# Voting Attendance App

Ứng dụng web điểm danh và bầu cử cho đại hội đoàn thanh niên, được xây dựng với Angular 20 và Supabase.

## Tính năng chính

- **Điểm danh**: Quét QR code từ CCCD/VNeID hoặc nhập thủ công
- **Bầu cử**: Bỏ phiếu cho các ứng cử viên
- **Dashboard**: Theo dõi thống kê real-time
- **Admin**: Quản lý danh sách, ứng cử viên, và kết quả

## Công nghệ sử dụng

- **Frontend**: Angular 20.3.0 với standalone components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **QR Scanner**: ZXing Library
- **UI/UX**: Responsive design với SCSS

## Cài đặt và chạy local

```bash
# Clone repository
git clone <your-repo-url>
cd voting-attendance-app

# Cài đặt dependencies
npm install

# Cấu hình environment
cp src/environments/environment.example.ts src/environments/environment.ts
# Cập nhật Supabase URL và API key trong environment.ts

# Chạy development server
npm start

# Mở trình duyệt tại http://localhost:4200
```

## Deploy lên Vercel

### 1. Chuẩn bị

- Đã push code lên GitHub
- Đã tạo tài khoản Vercel
- Đã cấu hình Supabase

### 2. Deploy

1. **Kết nối GitHub với Vercel:**
   - Đăng nhập vào [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import repository từ GitHub

2. **Cấu hình Environment Variables:**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy:**
   - Vercel sẽ tự động detect Angular project
   - Sử dụng file `vercel.json` đã cấu hình
   - Build command: `npm run vercel-build`
   - Output directory: `dist/voting-attendance-app/browser`

### 3. Cấu hình Domain (Optional)

- Vào Project Settings > Domains
- Thêm custom domain nếu cần

## Cấu trúc dự án

```
src/
├── app/
│   ├── components/
│   │   ├── home/           # Trang chủ
│   │   ├── qr-scanner/     # Quét QR code
│   │   ├── voting/         # Bỏ phiếu
│   │   ├── dashboard/      # Thống kê
│   │   ├── admin/          # Quản trị
│   │   └── Thamkhoa/       # Component tham khảo
│   ├── services/
│   │   ├── supabase.service.ts    # API Supabase
│   │   ├── auth.service.ts        # Authentication
│   │   └── notification.service.ts # Thông báo
│   ├── guards/
│   │   └── auth.guard.ts          # Bảo vệ routes
│   └── app.routes.ts              # Routing
├── environments/
│   └── environment.ts             # Cấu hình môi trường
└── styles/
    └── styles.scss                # Global styles
```

## Database Schema

### Tables chính:
- `roster`: Danh sách đại biểu
- `attendance`: Điểm danh
- `votes`: Phiếu bầu
- `candidates`: Ứng cử viên
- `election_status`: Trạng thái bầu cử

## API Endpoints

Tất cả API được quản lý qua Supabase service:
- `getRosterByCCCD()`: Tìm đại biểu theo CCCD
- `markAttendance()`: Điểm danh
- `castVote()`: Bỏ phiếu
- `getVotingResults()`: Kết quả bầu cử

## Troubleshooting

### Lỗi thường gặp:

1. **QR Scanner không hoạt động:**
   - Kiểm tra quyền camera
   - Thử refresh trang
   - Sử dụng upload ảnh thay thế

2. **Lỗi kết nối Supabase:**
   - Kiểm tra environment variables
   - Kiểm tra network connection
   - Kiểm tra Supabase project status

3. **Build lỗi trên Vercel:**
   - Kiểm tra Node.js version
   - Kiểm tra dependencies
   - Kiểm tra build logs

## Liên hệ

Nếu có vấn đề, vui lòng tạo issue trên GitHub repository.

## License

MIT License