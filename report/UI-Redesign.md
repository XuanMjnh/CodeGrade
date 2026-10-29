# CodeGrade — UI/UX redesign

Ngày triển khai: 29/10/2026. React 18, CSS thuần, Font Awesome và CodeMirror được giữ nguyên. Schema MySQL, luật game và công thức EXP/Elo được giữ. Command AUDIT có thêm tùy chọn tương thích ngược `summaryOnly`; lời gọi cũ vẫn trả payload đã lọc proof.

## Thiết kế toàn hệ thống

- Nền slate, card sáng, panel đậm và đường phân cách rõ; Inter cho nội dung, Manrope cho tiêu đề, JetBrains Mono cho mã nguồn/số liệu.
- Banner có nhãn ngữ cảnh và khối số liệu tương phản; bảng, bộ lọc, thống kê, podium, Contest countdown, hồ sơ, thông báo và xác thực dùng cùng hệ token.
- Header có trạng thái trang hiện tại, menu điều hướng trên màn nhỏ, `aria-expanded`, điều khiển Escape và skip link. Studio, workspace và Survival có chiều rộng riêng để dành diện tích cho nội dung.
- Không gian giải bài có statement, ví dụ, thanh tệp/ngôn ngữ, CodeMirror và thanh chạy/nộp phân tầng. Các quy tắc draft và xử lý ACK bài nộp được giữ.
- Xác nhận khi thay đổi quyền/kích hoạt tài khoản thông báo rõ việc thu hồi phiên đăng nhập.
- Nhật ký quản trị chỉ tải khi mở bảng, dùng `AUDIT {summaryOnly:true}` để lấy metadata. Trong database thử nghiệm, 100 payload cũ chiếm 138.740.241 byte, gây nghẽn WebSocket và thiếu bộ nhớ khi tải toàn bộ; không xóa hay sửa những bản ghi này.

## Question Studio

Năm bước: **Thông tin → Cấu hình chấm → Đáp án mẫu → Bộ kiểm thử → Nâng cao & xuất bản**. Chuyển bước không unmount dữ liệu đề. Tab hỗ trợ phím mũi tên, Home và End.

- Header hiển thị tên đề, mã, trạng thái, version và tình trạng lưu; có Import/Export JSON.
- Sidebar hỗ trợ có checklist theo dữ liệu hiện tại, lỗi validation, tóm tắt loại câu hỏi/ngôn ngữ/điểm/test và khôi phục nháp.
- Đáp án mẫu dùng CodeMirror; preload và global extra được giữ riêng. Editor khóa trong lúc lưu để tránh ghi đè chỉnh sửa mới bởi ACK cũ.
- Năm test được trình bày thành card; stdin/output đặt cạnh nhau trên desktop và xếp dọc trên mobile. Harness/extra, mark, ordering, testtype, hide-rest và các tùy chọn khác vẫn được lưu nguyên vẹn.
- **Public Example độc lập với Display**. Test có Display=HIDE vẫn có thể là Public Example nếu `useasexample=true`; UI không suy ra thuộc tính này từ Display.
- Sticky savebar có lưu, lưu và tiếp tục sửa, hủy; giữ dirty state, nháp cục bộ và cảnh báo trước khi rời route/tải lại. Nếu storage không dùng được, UI báo lỗi và vẫn cho lưu server/export.
- Lỗi tải đề cũ khóa thao tác lưu. Lỗi save giữ nội dung đang sửa. Sự kiện validation chỉ cập nhật `validatedVersion` cho đúng id/version; không ghi đè trường đang chỉnh sửa.
- Chuẩn hóa, validation và serializer CodeRunner hiện có được tái sử dụng. Các trường phụ thuộc, attachments, datafiles, template và sandbox giữ nguyên giới hạn nghiệp vụ.

## Code Survival

- Arena tối chỉ áp dụng cho Survival. Hero có typography lớn, lưới và hình terminal bằng CSS; không tải thêm ảnh/asset bên ngoài.
- Ba mode card cyan/coral/gold có mô tả, điều kiện, phần thưởng và trạng thái chọn/khóa.
- `ProgressionStrip` dùng lại ở sảnh và hồ sơ: tên/avatar, frame, level, EXP progress, rank/rating và badge lấy từ server.
- Tạo/join phòng giao lưu và danh sách phòng giữ API cũ. Giao lưu và luyện tập cá nhân không cộng EXP.
- Matchmaking có trạng thái tìm trận, thời gian chờ tính từ `joinedAt` với clock offset, số người chờ và rating range từ server; match found hiển thị số xác nhận và deadline thật, nhận/từ chối/hủy.
- HUD phòng đấu có vòng/loại vòng, timer và số Coder; thẻ người chơi phân biệt đang thi đấu, bị loại, bỏ cuộc và khán giả.
- Có UI cho COUNTDOWN, ACTIVE, GRADING, ROUND_RESULT, TIE_BREAK, RESCUE, FINISHED và UNRESOLVED. Chỉ hiển thị cúp/người thắng khi `state=FINISHED` và server có `winnerId` tương ứng.
- Kết quả/EXP/rating dùng `results` chính thức. Thuyết minh giữ chính sách hòa nhận EXP theo vị trí thấp nhất trong nhóm hòa; không tính thưởng dự kiến ở client.

## Các file thay đổi

| File | Nội dung |
|---|---|
| `frontend/src/style.css` | Entry chỉ import các module CSS theo thứ tự |
| `frontend/src/styles/tokens.css` | Semantic palette, typography, spacing, arena tokens |
| `frontend/src/styles/base.css` | Reset, controls, typography, focus |
| `frontend/src/styles/platform.css` | Card, bảng, bộ lọc, banner, auth, Contest, hồ sơ và progression |
| `frontend/src/styles/shell.css` | Header, responsive nav, layout và utility rails |
| `frontend/src/styles/workspace.css` | Statement, CodeMirror, ngôn ngữ/tệp và hành động nộp |
| `frontend/src/styles/studio.css` | Bố cục năm bước, test cards, support sidebar, sticky savebar |
| `frontend/src/styles/arena.css` | Theme Survival, hero, modes, queue, HUD, player/result states |
| `frontend/src/main.jsx` | Shell theo route, điều hướng mobile và cơ chế cảnh báo rời trang |
| `frontend/src/components/PageBanner.jsx` | Nhãn ngữ cảnh banner |
| `frontend/src/components/CodeEditor.jsx` | Label/height cấu hình được và readOnly khi lưu |
| `frontend/src/components/ProgressionStrip.jsx` | Thành phần progression dùng chung |
| `frontend/src/pages/QuestionEditor.jsx` | Question Studio và bảo vệ nội dung đang sửa |
| `frontend/src/pages/SurvivalLobby.jsx` | Hero, chọn mode, progression, tìm trận và lịch sử |
| `frontend/src/pages/Survival.jsx` | HUD và UI theo trạng thái phòng/vòng |
| `frontend/src/pages/Workspace.jsx` | Wrapper cho workspace thường/thi đấu |
| `frontend/src/pages/Practice.jsx` | Toolbar, thông tin EXP và reset khi không có kết quả |
| `frontend/src/pages/Community.jsx` | Dùng chung progression ở hồ sơ |
| `frontend/src/pages/Records.jsx` | Xác nhận phân quyền; tải nhật ký tóm tắt theo nhu cầu |
| `backend/src/main/java/vn/codegrade/protocol/Commands.java` | AUDIT summary projection, giữ nguyên quyền và kết quả mặc định |
| `backend/src/test/java/vn/codegrade/SystemIntegrationTest.java` | Regression cho payload lớn, tương thích lời gọi cũ và phân quyền AUDIT |
| `frontend/src/lib/translations.json` | Từ vựng giao diện mới |
| `frontend/tests/redesign.test.js` | Component regression cho studio và arena |
| `frontend/tests/contrast.test.js` | Tương phản ở light/dark và editor/controls |
| `frontend/tests/survival-ui.cjs` | Kiểm tra bundle thật với WebSocket/MySQL thật |
| `README.md` | Liên kết bàn giao và kết quả mới |
| `report/UI-Redesign.md` | Bàn giao thiết kế, file thay đổi và giới hạn kiểm thử |
| `statics/results/redesign-verification.json` | Kết quả test/build máy đọc |
| `statics/results/redesign-ui-live.json` | Hành trình DOM/WebSocket/MySQL thật |

## Kiểm thử và giới hạn

Kết quả máy đọc nằm trong `statics/results/redesign-verification.json` và `statics/results/redesign-ui-live.json`. Các báo cáo v6 cũ được giữ như lịch sử, không dùng thay kết quả redesign.

- `npm ci`: đã chạy. Không nâng cấp dependency bằng `audit fix --force`; npm báo hai advisory mức high trong cây dependency hiện có.
- `npm test`: **119/119 đạt**. Bộ kiểm tra bao gồm schema/JSON, draft, nhập/lưu thất bại, phụ thuộc/disabled, chuyển bước, điều hướng, ACK muộn của workspace và các trạng thái game bằng component fixture. Fixture chỉ dùng trong test, không có dữ liệu giả trong sản phẩm.
- `mvn -B test`: **92/92 đạt**, gồm regression AUDIT summary và tương thích kết quả cũ.
- `npm run build`: production build đạt. Vite còn cảnh báo bundle JavaScript vượt 500 kB; chưa thay chiến lược nạp module của ứng dụng trong đợt này.
- **18 kiểm tra DOM/server thật đạt**, gồm ba vai trò, JSON round trip và trận Normal 5 người qua 3 vòng, với các trạng thái COUNTDOWN/ACTIVE/GRADING/RESULT/FINISHED. Nhật ký tóm tắt trả 13.991 byte ở lần kiểm tra cuối.
- Kiểm tra server thật sử dụng database/project Compose kiểm thử riêng. Các số liệu trong báo cáo live là hành trình thực, không phải ảnh hoặc dữ liệu mô phỏng.
- Responsive có breakpoint cho mobile 360–430, tablet 768 và desktop 1280–1920; bảng giữ cuộn ngang khi cần, form/HUD/test I/O chuyển cột. **Chưa xác minh layout, overflow và hình ảnh hiển thị bằng trình duyệt native trên các viewport này.**
- Chưa có screenshot trước/sau: công cụ điều khiển/chụp trình duyệt không khả dụng trong phiên này. JSDOM chỉ kiểm tra cấu trúc và hành vi DOM; không dùng nó để khẳng định chất lượng bố cục hay screenshot.
- Focus, tab navigation, trạng thái ARIA, reduced motion và tương phản token có kiểm tra tự động. Chưa kiểm tra bằng screen reader thực hoặc thiết bị cảm ứng.
