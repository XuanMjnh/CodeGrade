# Frontend CodeGrade Network

React 19, Vite 7, shadcn/ui (JavaScript), Tailwind CSS 4 và Lucide. Giữ bố cục và bảng màu của giao diện gốc: header ngang, cột tiện ích hai bên, nền `#f5f6f7`, chữ `#303834`, điểm nhấn cam `#c65316` và xanh lá `#24744c`/`#216b45`, font Inter/Manrope/JetBrains Mono. CodeMirror tiếp tục phục vụ soạn mã C++/Python; giao diện hỗ trợ desktop/mobile và điều hướng bằng bàn phím.

## Chạy và kiểm tra

Cần Node.js ≥22.12 và backend đang chạy tại `http://localhost:8080`.

```powershell
cd frontend
npm ci
npm run dev
```

Mở `http://localhost:5173`. Vite chuyển tiếp `/api` và `/ws` tới backend. Khi đóng gói bằng Docker, Spring Boot phục vụ bản build tại cổng 8080.

```powershell
npm test
npm run build
npm run test:e2e
npm run format
```

Kiểm thử trình duyệt dùng Edge đã cài trên Windows, hoặc Chromium của Playwright (`npx playwright install chromium`). Backend cần có tài khoản demo `admin`, `coder01`, `coder02`, ngân hàng đề đã xác thực và worker hoạt động. Bộ kiểm thử đọc mật khẩu từ `../.env`; có thể chỉ định `CG_ENV_FILE`, hoặc `CG_ADMIN_PASSWORD` và `CG_DEMO_PASSWORD`. Các bài kiểm thử tạo bài nộp và một phòng đấu thật nên dùng môi trường demo. Phòng được rời sau kiểm thử.

Để kiểm tra bản build đang phục vụ thay cho Vite:

```powershell
$env:CG_UI_URL='http://127.0.0.1:8080'
npm run test:e2e
```

## Cấu trúc

| Đường dẫn | Trách nhiệm |
|---|---|
| `src/App.jsx` | Route, quyền truy cập, tải trang khi cần và thông báo Sonner |
| `src/components/layout/AppShell.jsx` | Header ngang, menu tài khoản, menu mobile mở dưới header và hai cột tiện ích |
| `src/components/ui/` | Mã nguồn component shadcn/ui; Radix cung cấp tương tác và quản lý focus |
| `src/components/shared-ui.jsx` | Thành phần theo nghiệp vụ: Field, trạng thái, lỗi, thời gian còn lại |
| `src/components/DataTable.jsx` | Bảng shadcn có phân trang bằng state React |
| `src/components/CodeEditor.jsx` | CodeMirror, syntax highlight và theme theo token chung |
| `src/hooks/` | Kết nối ứng dụng, đọc tài nguyên và đồng hồ dùng chung |
| `src/pages/` | Luyện tập, thi đấu, lịch sử, hồ sơ, cộng đồng và quản trị |
| `src/lib/live.js` | Giao thức WebSocket, ACK/EVENT, retry và reconnect |
| `src/index.css` | Tailwind, token theme và base styles dùng chung |
| `tests/browser/` | Kiểm thử trình duyệt thật bằng Playwright |

Không còn các stylesheet giao diện cũ trong `src/styles/`, Font Awesome, nền ảnh cũ hoặc script phân trang sửa DOM trực tiếp. Bố cục và trạng thái dùng utility Tailwind. `src/index.css` giữ cấu hình theme cần thiết cho Tailwind/shadcn; theme CodeMirror được cấu hình qua API của editor.

## Thêm hoặc sửa component

`components.json` dùng preset `new-york`, `tsx: false`, alias `@/components/ui` và `@/lib/utils`. Cấu hình alias đồng bộ ở `jsconfig.json` và `vite.config.js`.

Khi thay component, giữ bố cục, màu, font và thứ tự các khối của giao diện gốc. Việc dùng shadcn/ui không đồng nghĩa đổi sang giao diện mặc định của thư viện hoặc thay header ngang bằng sidebar.

```powershell
npx shadcn@4.23.0 add <component>
```

Import component từ `@/components/ui/<component>`, kết hợp class bằng `cn()` trong `src/lib/utils.js`. Đổi màu/radius chung trong `src/index.css`, tránh thêm stylesheet riêng cho từng trang. Giữ nhãn biểu mẫu, trạng thái disabled/busy, focus và thông báo lỗi khi sửa tương tác.

## Tối ưu và phạm vi kiểm thử

Các route và editor được tải qua `React.lazy`. Bản build tách runtime UI, lõi CodeMirror và grammar ngôn ngữ; trang luyện tập đọc một danh sách để tổng hợp và lọc. `useResource` gộp yêu cầu đang chạy giống nhau trong cùng phiên, không lưu cache kết quả lâu dài. Đồng hồ các trang dùng chung một interval.

Giữ nguyên giao thức backend, quyền ADMIN/AUTHOR/CODER, Question Studio năm bước, các mode Survival, Contest, bản nháp theo bài/trận/vòng và luồng nộp bài. Kiểm thử đơn vị bao phủ các quy tắc frontend và độ tương phản theme. Bộ Playwright kiểm tra các trang chính, bố cục header/cột tiện ích, bảng màu, ba thẻ mode ngang, các bước Studio, menu mobile/focus, nộp bài giữ mã nguồn và khôi phục bản nháp trong phòng đấu hai người. Đây không phải kiểm thử tải hoặc kiểm chứng toàn bộ kết quả thi đấu của mọi mode.

Ngày 30/10/2026: 82/82 kiểm thử đơn vị và 6/6 kiểm thử Playwright trên bản build Docker đạt, gồm kiểm tra bố cục/bảng màu gốc; build, định dạng và `npm audit` đạt (0 lỗ hổng được báo cáo).
