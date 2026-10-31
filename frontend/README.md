# Frontend CodeGrade Network 6.0.0

React 19, Vite 7, shadcn/ui (JavaScript), Tailwind CSS 4, Radix, Lucide và Sonner. CodeMirror 6 phục vụ soạn mã C++/Python. Giao diện hỗ trợ VI/EN, desktop/mobile và điều hướng bằng bàn phím; nội dung đề và source được giữ nguyên khi đổi ngôn ngữ giao diện.

## Chạy và build

Cần Node.js ≥22.12 và backend tại `http://localhost:8080`. Từ thư mục `Source`:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Mở http://localhost:5173. [vite.config.js](vite.config.js) proxy `/api` và `/ws` tới backend cổng 8080; khi đổi cổng backend phải đổi proxy. Origin của Vite phải được server cho phép: thêm `http://localhost:5173,http://127.0.0.1:5173` vào `APP_ORIGINS`. Compose mặc định chỉ cho phép cổng 8080, nên cần cập nhật environment và tạo lại server nếu dùng Vite cùng backend Compose.

```powershell
npm run build
npm run preview
```

Build tạo `dist/`. `preview` chỉ xem bản build, không có proxy backend được cấu hình như dev server. Khi chạy toàn hệ thống qua Docker, stage build đưa `dist/` vào Spring Boot JAR và server phục vụ UI tại cổng 8080. Xem [README gốc](../README.md) để chạy server, worker và database.

## Các trang

App dùng hash route trong [src/App.jsx](src/App.jsx), tải trang qua `React.lazy` sau khi đăng nhập:

| Route | Nội dung |
|---|---|
| `#/practice` | Kho bài, bộ lọc, bookmark, tiến độ chủ đề và gợi ý bài chưa giải |
| `#/solve/:id` | Đề bài, ví dụ, editor, kết quả, lịch sử, xếp hạng từng bài và bình luận |
| `#/solve/:id?contest=:contestId` | Editor với ngữ cảnh và bản nháp riêng của Contest |
| `#/survival` | Ba mode, hồ sơ rank, queue, phòng Giao lưu và lịch sử trận |
| `#/room/:id` | Lobby, cấu hình/nhận trận, countdown, vòng đấu, standings và kết quả |
| `#/contests`, `#/contests/:id` | Lịch thi, tạo/đăng ký/duyệt, phòng thi và bảng điểm |
| `#/submissions` | Thống kê bài gần đây và lịch sử phân trang từ server |
| `#/leaderboard` | Bảng xếp hạng CODER theo chỉ số lựa chọn |
| `#/profile`, `#/announcements` | Hồ sơ, đổi mật khẩu và thông báo |
| `#/edit`, `#/edit/:id`, `#/categories` | Question Studio và danh mục cho AUTHOR/ADMIN |
| `#/admin` | Tài khoản, quyền và audit cho ADMIN |

Frontend kiểm tra quyền khi chọn route; backend vẫn kiểm tra quyền cho từng command. Các số liệu và kết quả trận lấy từ server, không tự tính người thắng hoặc cấp EXP/rating trên trình duyệt.

## Bố cục và theme

[src/components/layout/AppShell.jsx](src/components/layout/AppShell.jsx) dùng header ngang, menu tài khoản và menu mobile mở dưới header. Các trang thường có cột phải từ 851 px và thêm cột trái từ 1440 px. `solve`, `edit`, `survival`, `room` dùng khung tập trung, ẩn hai cột tiện ích chung.

Sảnh Survival có bố cục ba cột ở màn hình rộng: tiến trình/rank, nội dung phòng/queue và chọn mode. Thẻ mode xếp ngang ở kích thước trung bình, chuyển dọc ở màn hình lớn; không cố định ba thẻ ngang ở mọi độ rộng. Phòng đấu có HUD, các giai đoạn, danh sách người chơi và workspace. Contest chuyển từ danh sách sang không gian thi riêng theo route.

Question Studio là biểu mẫu cuộn gồm năm phần: thông tin đề, chấm điểm/cài đặt, lời giải mẫu, testcase, nâng cao. Điều hướng cuộn theo phần và theo dõi phần hiện tại bằng `IntersectionObserver`; có xem trước, checklist, Ctrl/Cmd+S, nhập/xuất JSON và khôi phục nháp. Từ 961 px có cột điều hướng, từ 1361 px thêm cột tóm tắt. Đây không còn là mô tả năm tab ẩn/hiện độc lập.

Theme nằm trong [src/index.css](src/index.css): nền `#f5f6f7`, chữ `#303834`, cam hành động `#c65316`, xanh chính `#24744c`, xanh thành công `#216b45`; font Inter/Manrope/JetBrains Mono. File CSS còn chứa animation và style nghiệp vụ cho mode/rank/arena. Các component dùng utility Tailwind và token chung; `ProgressMeter` bọc progress để hiển thị phần trăm thống nhất.

## Cấu trúc mã nguồn

| Đường dẫn | Trách nhiệm |
|---|---|
| `src/App.jsx` | Hash route, quyền UI, lazy loading và thông báo Sonner |
| `src/components/layout/AppShell.jsx` | Header, tìm kiếm, menu, bố cục responsive |
| `src/components/ui/` | Component shadcn/ui và tương tác Radix |
| `src/components/ui.jsx`, `shared-ui.jsx` | Thành phần và export dùng chung trong ứng dụng |
| `src/components/CodeEditor.jsx` | Lazy CodeMirror, grammar C++/Python và theme editor |
| `src/components/SubmissionHistory.jsx`, `SubmissionResult.jsx` | Lịch sử theo ngữ cảnh, kết quả và tiến độ chấm |
| `src/components/ProblemRanking.jsx`, `LiveStandings.jsx` | Xếp hạng từng bài và vòng đấu |
| `src/components/RankEmblem.jsx`, `CurrentRankCard.jsx`, `ProgressionStrip.jsx` | Biểu diễn rank và tiến trình theo dữ liệu server |
| `src/pages/Practice.jsx`, `Workspace.jsx` | Kho bài và không gian giải bài |
| `src/pages/QuestionEditor.jsx` | Question Studio, schema, nháp và nhập/xuất JSON |
| `src/pages/Survival.jsx`, `SurvivalLobby.jsx`, `SurvivalRoomView.jsx` | Kết nối/phục hồi phòng, sảnh và giao diện đấu |
| `src/pages/Contests.jsx`, `Records.jsx`, `Leaderboards.jsx`, `Community.jsx` | Contest, bài nộp/quản trị, leaderboard và cộng đồng |
| `src/hooks/` | Kết nối ứng dụng, đọc dữ liệu, đồng hồ server |
| `src/lib/live.js` | WebSocket v1, ACK/EVENT, session, retry và reconnect |
| `src/lib/coderunner.js` | Mặc định/chuẩn hóa/kiểm tra/serialize cấu hình đề |
| `src/lib/competition.js` | Scope bản nháp theo trận/vòng/bài |
| `src/lib/insights.js` | Tổng hợp bản ghi đang có, không tạo dữ liệu mẫu |
| `src/lib/locale.js`, `translations.json` | Từ điển VI/EN; lựa chọn lưu trong `localStorage` |
| `tests/*.test.js`, `tests/browser/` | Node/JSDOM và Playwright |

`components.json` cấu hình preset `new-york`, `tsx: false`, alias `@/components/ui`, `@/lib/utils`; alias đồng bộ trong `jsconfig.json` và Vite. Ghép class bằng `cn()`, giữ nhãn biểu mẫu, focus, disabled/busy và lỗi khi sửa component.

## Kết nối, dữ liệu và bản nháp

`LiveClient` lưu token/cursor ở `sessionStorage`, PING mỗi 15 giây, reconnect từ 0,5 đến tối đa 10 giây. Khi nối lại, `AUTH` gửi `lastSeq`, pending request giữ ID/payload, rồi ứng dụng gọi `SYNC`. ACK lỗi có `code`; request chưa có ACK sau 30 giây báo lỗi để người dùng retry. Đổi mật khẩu hoặc quyền tài khoản có thể thu hồi session.

`useResource` gộp request đang chạy giống nhau theo phiên/type/payload/revision, không cache kết quả dài hạn. `useApplication` gom cập nhật event trong 200 ms; `useServerTime` dùng một interval chung 250 ms cộng offset từ server. Vite tách UI runtime, editor core và grammar ngôn ngữ thành chunk riêng.

| Ngữ cảnh | Khóa nháp/đồng bộ |
|---|---|
| Practice | Tài khoản + bài; localStorage và server sau 1,2 giây ngừng sửa |
| Contest | Tài khoản + contest + bài; chỉ localStorage |
| Survival | Tài khoản + phòng + vòng + bài; chỉ localStorage |
| Question Studio | `cg-question-draft-<id hoặc new>`; nháp cấu hình cục bộ, chưa tách theo tài khoản |

Submit, chạy thử và lỗi submit đều giữ source. Operation lưu requestId/payload để retry; ACK của ngữ cảnh cũ không thay editor mới. Editor Survival chỉ đọc khi vòng không hoạt động hoặc người chơi không còn quyền thi đấu. Phản hồi test ẩn và source đối thủ không được UI yêu cầu thay cho dữ liệu server cho phép.

Trang lịch sử gọi `SUBMISSIONS_PAGE`, hỗ trợ 10/20/50 dòng và lọc all/pending/ac/other. Thống kê tổng quan và lịch sử trong workspace dùng `SUBMISSIONS`, tối đa 100 bài gần nhất; phần trăm ở đây phản ánh tập dữ liệu đó.

## Kiểm thử

Chạy các lệnh sau tại `frontend`:

```powershell
npm test
npm run build
npm run test:e2e
```

`npm test` chạy `node --test tests/*.test.js`. Bộ test bao phủ schema đề, bản nháp, retry/reconnect, locale, thời gian, rank, contrast, Practice, Contest, bài nộp, Question Studio và trạng thái Survival. Một số test dựng component bằng JSDOM; không tương đương kiểm thử trên trình duyệt thật.

Playwright dùng Edge tại đường dẫn cấu hình trên Windows nếu có, hoặc Chromium (`npx playwright install chromium`). Backend cần demo `admin`, `coder01`, `coder02`, ngân hàng đề đã xác thực và worker hoạt động. Test đọc mật khẩu từ `../.env`, có thể đổi bằng `CG_ENV_FILE` hoặc `CG_ADMIN_PASSWORD`/`CG_DEMO_PASSWORD`. Test tạo bài nộp và phòng thật nên dùng môi trường demo riêng.

```powershell
$env:CG_UI_URL='http://127.0.0.1:18080'
$env:CG_ENV_FILE='C:/path/to/demo.env'
npm run test:e2e
```

Không đặt `CG_UI_URL` thì Playwright tự mở Vite tại `127.0.0.1:5173`. Đặt biến này để kiểm tra server đang phục vụ bản build. Hai script cũ `tests/ui-integration.cjs`, `tests/survival-ui.cjs` không nằm trong lệnh `npm test` hoặc `test:e2e`; kiểm tra điều kiện riêng trước khi chạy trực tiếp.

`npm run format` ghi lại định dạng source/test. Khi chỉ muốn kiểm tra định dạng, dùng:

```powershell
npx prettier --check src tests vite.config.js playwright.config.js
```

Kết quả chạy lại ngày **31/10/2026**: **85/85 test đạt**, production build đạt với Vite 7.3.7. Tám lỗi Question Studio đã được xử lý bằng mô phỏng IntersectionObserver trong JSDOM và cập nhật kỳ vọng test theo mục lục cuộn/nhãn nút hiện tại. Có thêm kiểm tra đổi mục đang xem theo intersection và thu hồi observer khi unmount; kiểm tra bàn phím checklist vẫn bao phủ Enter/Space. File `redesign.test.js` đã qua Prettier. Playwright, định dạng toàn bộ frontend và audit chưa chạy lại; các số liệu cũ 82/82 hoặc 6/6 không được coi là kết quả của source hiện tại. Log lần chạy Node được lưu tại `../statics/results/readme-frontend-tests.tap` trong workspace, không theo dõi trong Git.
