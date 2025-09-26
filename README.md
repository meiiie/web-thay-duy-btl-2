# 🏛️ Hệ Thống Điểm Danh & Bầu Cử

Ứng dụng web Angular để quét mã QR từ CCCD/VNeID cho việc điểm danh và bầu cử trực tuyến.

## ✨ Tính năng chính

### 📱 Điểm danh bằng QR Code
- Quét mã QR từ CCCD hoặc VNeID qua webcam
- Trích xuất số CCCD (12 chữ số) làm khóa chính
- Kiểm tra danh sách đại biểu trong database
- Tự động tạo mã phiếu bầu cử sau khi điểm danh thành công
- Fallback options: Upload ảnh QR hoặc nhập thủ công CCCD/MSSV

### 🗳️ Hệ thống bầu cử
- Xác thực mã phiếu trước khi bầu cử
- Chọn ứng cử viên từ danh sách có sẵn
- Mỗi mã phiếu chỉ sử dụng được một lần
- Lưu trữ kết quả bầu cử minh bạch

### ⚙️ Panel quản trị
- Quản lý danh sách đại biểu
- Thêm/xóa ứng cử viên
- Xem thống kê điểm danh và bầu cử
- Xuất báo cáo Excel
- Theo dõi kết quả real-time

## 🛠️ Công nghệ sử dụng

- **Frontend**: Angular 20+ với TypeScript
- **Backend**: Supabase (PostgreSQL + Real-time APIs)
- **QR Scanner**: ZXing Browser Library
- **UI**: SCSS với responsive design
- **Deployment**: Vercel/Netlify ready

## 📋 Yêu cầu hệ thống

- Node.js 18+ 
- npm hoặc yarn
- Webcam cho tính năng quét QR
- HTTPS cho truy cập webcam (production)

## 🚀 Cài đặt và chạy

### 1. Clone và cài đặt dependencies
```bash
git clone <repository-url>
cd voting-attendance-app
npm install
```

### 2. Thiết lập Supabase Database
1. Tạo project mới trên [Supabase](https://supabase.com)
2. Chạy file `database-schema.sql` trong SQL Editor
3. Cập nhật environment variables trong `src/environments/`

### 3. Chạy ứng dụng
```bash
# Development
ng serve

# Production build
ng build --configuration production
```

Truy cập: `http://localhost:4200`

## 📊 Cấu trúc Database

### Bảng `roster` (Danh sách đại biểu)
```sql
- id: SERIAL PRIMARY KEY
- cccd: VARCHAR(12) UNIQUE (khóa chính)
- hoten: VARCHAR(255) (Họ tên)
- mssv: VARCHAR(20) (Mã số sinh viên)
- lop: VARCHAR(50) (Lớp)
- created_at: TIMESTAMP
```

### Bảng `attendance` (Điểm danh)
```sql
- id: SERIAL PRIMARY KEY
- cccd: VARCHAR(12) REFERENCES roster(cccd)
- time: TIMESTAMP (Thời gian điểm danh)
- created_at: TIMESTAMP
```

### Bảng `codes` (Mã phiếu bầu cử)
```sql
- id: SERIAL PRIMARY KEY
- code: VARCHAR(8) UNIQUE (Mã phiếu)
- cccd: VARCHAR(12) REFERENCES roster(cccd)
- used: BOOLEAN (Đã sử dụng chưa)
- created_at: TIMESTAMP
```

### Bảng `votes` (Phiếu bầu)
```sql
- id: SERIAL PRIMARY KEY
- code: VARCHAR(8) REFERENCES codes(code)
- candidate: VARCHAR(255) (Tên ứng cử viên)
- time: TIMESTAMP (Thời gian bầu)
- created_at: TIMESTAMP
```

### Bảng `candidates` (Ứng cử viên)
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(255) (Tên ứng cử viên)
- position: VARCHAR(255) (Vị trí ứng cử)
- description: TEXT (Mô tả)
- active: BOOLEAN (Có hoạt động không)
- created_at: TIMESTAMP
```

## 🔧 Cấu hình Environment

Cập nhật file `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

## 📱 Hướng dẫn sử dụng

### Cho người điểm danh:
1. Truy cập trang "Điểm Danh"
2. Cho phép truy cập webcam
3. Đưa CCCD/VNeID vào khung hình camera
4. Nhận mã phiếu sau khi điểm danh thành công

### Cho người bầu cử:
1. Truy cập trang "Bầu Cử"
2. Nhập mã phiếu nhận được
3. Chọn ứng cử viên muốn bầu
4. Xác nhận bầu cử

### Cho quản trị viên:
1. Truy cập trang "Quản Trị"
2. Quản lý danh sách đại biểu và ứng cử viên
3. Xem thống kê và xuất báo cáo

## 🔒 Bảo mật

- Row Level Security (RLS) được bật trên tất cả bảng
- Mã phiếu được tạo ngẫu nhiên và chỉ sử dụng một lần
- Kiểm tra tính hợp lệ của CCCD trước khi điểm danh
- HTTPS bắt buộc cho truy cập webcam

## 🚀 Deployment

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
ng build --configuration production
# Upload dist/ folder to Netlify
```

## 📝 Ghi chú quan trọng

1. **HTTPS**: Webcam chỉ hoạt động trên HTTPS hoặc localhost
2. **QR Format**: Hệ thống hỗ trợ nhiều định dạng QR từ CCCD/VNeID
3. **Fallback**: Có tùy chọn upload ảnh hoặc nhập thủ công khi webcam lỗi
4. **Real-time**: Supabase cung cấp real-time updates cho admin panel
5. **Responsive**: Giao diện tương thích với mobile và desktop

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ qua email.

---

**Lưu ý**: Đây là ứng dụng MVP cho mục đích học tập và demo. Trong môi trường production thực tế, cần thêm các biện pháp bảo mật và xác thực nghiêm ngặt hơn."# web-thay-duy-btl-2" 
