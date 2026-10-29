# Phụ lục kỹ thuật: Code Survival và CodeGrade Network 6.0.0

Ngày kiểm chứng: 29/10/2026. Đây là phần bổ sung cho báo cáo Word gốc, không tự xác nhận phân công, đóng góp cá nhân hay các thủ tục nộp bài của học phần.

## Abstract

CodeGrade Network được mở rộng thành hệ thống luyện tập và thi đấu lập trình có một engine Survival với Practice, Normal và Ranked. Hệ thống dùng WebSocket cho command/ACK/EVENT, MySQL cho hàng đợi và trạng thái bền vững, Java worker cho chấm bất đồng bộ trong Docker. Normal/Ranked chỉ tạo nhóm năm CODER, có bước xác nhận và ghép Ranked theo độ chênh rating toàn nhóm. EXP phản ánh tiến trình học; Elo riêng phản ánh kết quả cạnh tranh. Settlement theo transaction và unique event key tránh cộng điểm trùng. Bản nâng cấp giữ lịch sử và UUID/mã bài, bổ sung 200 bài, chuẩn hóa ngân hàng 320 bài thành 1.600 testcase. Kết quả gồm 91 test backend, 68 test frontend, 7 kiểm tra DOM/server thật, ba mode chạy qua worker thật, kiểm tra restart và kiểm chứng lời giải tham chiếu.

Keywords: WebSocket, matchmaking, online judge, concurrency, idempotency, multiplayer Elo.

## Problem definition và phạm vi

Đầu vào gồm các command có requestId, thao tác người chơi, hàng đợi, source và kết quả worker. Đầu ra là ACK sau commit, EVENT riêng đúng người dùng, kết quả chấm/vòng/trận và phần thưởng chính thức. Client không được tự quyết định mode, đối thủ, số người, EXP hay rating.

Các ràng buộc chính: Practice 2–10; Normal/Ranked đúng năm; không bot; không bắt đầu khi thiếu xác nhận; không ghép một tài khoản vào hai trận; không dùng completion time để quyết định cutoff; không thưởng lại khi replay; không ghi đè đề AUTHOR đã chỉnh; không sửa snapshot/verdict lịch sử; không reset MySQL/volume. Thay đổi là phần mở rộng của source hiện có, không viết lại engine hay chuyển toàn hệ thống sang REST.

## Thiết kế và communication flow

1. React mở `/ws`, LOGIN/AUTH và giữ event cursor của phiên.
2. Client gửi JSON v1 gồm type, requestId và payload.
3. Commands xác thực lại user, kiểm tra ledger và chạy nghiệp vụ trong Store.atomic.
4. MySQL khóa system_lock, ghi trạng thái/command response/EVENT rồi commit.
5. ClientSocket trả ACK; bộ phát EVENT đọc log và gửi đến kết nối có quyền.
6. Worker AUTH qua `/worker-ws`, CLAIM job theo lease, nhận source/harness/stdin; expected output nằm trên server.
7. Worker chạy sandbox riêng từng test, báo PROGRESS, HEARTBEAT và RESULT. Kết quả lease cũ bị từ chối.
8. Server so output, ghi verdict, chốt vòng, settlement và phát sự kiện.

TCP/WebSocket cung cấp kênh hai chiều lâu dài; requestId và event log giải quyết retry/reconnect ở tầng nghiệp vụ. Không dùng việc socket gửi thành công để suy ra giao dịch đã commit. Mã người chơi chỉ chạy trong container không mạng, read-only, user không đặc quyền, giới hạn CPU/RAM/PID/output và tmpfs riêng.

## Cấu trúc implementation

| Thành phần | Vai trò |
|---|---|
| Store | Giao dịch và khóa database dùng chung, JSON, event/audit |
| Commands / ClientSocket | Ledger, phân quyền, ACK sau commit, replay/sanitize payload |
| Matchmaking | Queue SQL, chọn nhóm, accept/decline/expire, restore sau restart |
| Survival / RoundRanking | Engine vòng chung, bank snapshot, admission, cutoff, tie/rescue/final |
| Progression | EXP/Level/Rank, Elo, reward ledger, match history/leaderboard |
| Submissions / WorkerMain | Admission và snapshot, job/lease/progress, judge/settlement |
| SeedBankExpansion | Nâng cấp theo nội dung, bảo toàn ID, defer/conflict và validation |
| SurvivalLobby / Room | Ba mode, queue, nhận trận, thời gian, roster và kết quả |
| Workspace / competition.js | Scope thi đấu, bảo vệ ACK muộn, không khôi phục nháp thi đấu |

## Matchmaking, concurrency và fault tolerance

Queue có khóa chính user_id; người cùng tài khoản trên nhiều kết nối chỉ có một suất. Kiểm tra queue lẫn roster phòng đang hoạt động trước khi tham gia. Việc chọn năm người, tạo phòng và đánh dấu MATCH_FOUND nằm trong cùng critical section SQL, vì vậy hai matcher không thể lấy trùng người. FIFO ưu tiên các lựa chọn tương đương. Nhóm rating cô lập không chặn nhóm khác đủ điều kiện.

Normal ưu tiên Level gần trong 10 giây đầu, sau đó ưu tiên chờ lâu. Ranked có bốn ngưỡng chênh toàn nhóm: 150,250,350,400 tại 0,10,20,30 giây; dừng nới ở 400. Ngưỡng tính trên max−min của cả năm, không chỉ khoảng cách đến anchor. Không cố trì hoãn khi có thể ghép ngay.

MATCH_FOUND chỉ là đề nghị: đủ năm ACCEPT mới chuyển COUNTDOWN. Hết hạn hoặc từ chối trước trận đóng đề nghị và trả các người còn hợp lệ về WAITING với joinedAt cũ. Trước vòng đầu kiểm tra lại năm lease sẵn sàng. Khi trận đã bắt đầu, không xóa người mất kết nối khỏi roster; grace 90 giây rồi forfeit. Queue/trận lưu SQL, SYNC/MATCH_SNAPSHOT khôi phục trạng thái. Replay cùng requestId trả phản hồi cũ đã lọc proof, không tái tạo phòng.

Hạn chế: khóa toàn cục làm đơn giản hóa chứng minh tính đúng, đổi lại hạn chế throughput. Có bảo vệ khi nhiều tiến trình dùng cùng SQL nhưng chưa đo HA, failover nhiều máy hay throughput matcher ở quy mô lớn.

## Xếp hạng vòng và chốt kết quả

RoundRanking sử dụng received_at, điểm, AC, penalty và số lần thử; không dùng completed_at để phá hòa. Chờ bài đúng hạn hoàn tất khi chốt vòng. Ở chung kết, AC đến sau phải đợi bài nhận sớm hơn còn chấm; nếu bài sớm hơn AC thì bài đó thắng. Khi hạ tầng trả SE sau retry, vòng bị vô hiệu và dùng RESCUE, không trừ rating do lỗi hệ thống.

Thứ hạng trận dùng mốc tồn tại/bị loại; các người cùng cohort bị loại đồng hạng nếu không có luật phân định bổ sung. Người forfeit có eliminatedStage được giữ, không thể nâng hạng bằng cách gửi lại ROOM_LEAVE. Không còn ALIVE hoặc không ai AC: UNRESOLVED, không settlement phần thưởng. Kết quả/lịch sử phòng giữ lại khi thành viên rời.

## Elo năm người và gamification

Rating trước trận là R. Với mỗi cặp i,j: `E=1/(1+10^((Rj−Ri)/400))`; S bằng 1,0.5,0 theo hạng. `DeltaRi=round((32/4)*Σ(S−E))`. Hệ số 1/4 chuẩn hóa bốn đối thủ. Không cập nhật tuần tự rating người sau từ rating đã đổi của người trước. Năm người cùng rating 1000 với thứ hạng phân biệt nhận +16,+8,0,−8,−16. Người mạnh thắng đối thủ yếu được ít điểm; upset cho thay đổi lớn hơn. Không áp dụng cố định số điểm theo tên bậc Rank.

Survival rating tách khỏi Elo Contest. Chỉ FINISHED đủ roster mới cập nhật cả năm trong một transaction; reward key theo match/user và khóa match_results chống double settlement. Đồng hạng dùng S=0.5. Thứ hạng các ngưỡng và K nằm trong backend configuration.

Luyện tập cá nhân và giao lưu (Survival Practice) không cộng EXP, kể cả AC lần đầu. Normal/Ranked không hòa nhận 100/80/60/40/20 EXP. Đồng hạng nhận EXP theo vị trí thấp nhất mà nhóm hòa chiếm: một người nhất nhận 100, bốn người còn lại hòa nhau nhận 20 mỗi người; hai người cùng hạng 2 nhận 60 mỗi người. Thứ hạng dùng tính Elo vẫn giữ đồng hạng và S=0.5. Chính sách mới áp dụng cho kết quả mới; không tính lại phần thưởng lịch sử. EXP không bị trừ khi thua. `Level=1+floor(sqrt(EXP/100))`, huy hiệu/khung chỉ hiển thị, không tạo lợi thế Ranked.

Ứng dụng gamification ở đây kết hợp phản hồi nhanh qua judge, cột mốc Level, phần thưởng giới hạn và cạnh tranh theo Elo. Không có phép đo trong bản này chứng minh hiệu quả sư phạm hay tăng kết quả học tập; muốn khẳng định điều đó cần nghiên cứu người dùng riêng.

## Loại bỏ proof và bảo toàn editor

Đã bỏ ReceiptLedger, SignedProof, browser verifier và công cụ test ký proof khỏi luồng mới. Bảng signing_keys/receipts cũ không bị xóa; source/snapshot/admission order/ledger/lease vẫn giữ. Command RECEIPT_GET bị từ chối trước lookup ledger; response cũ và EVENT replay loại receipt/certificate. AUDIT trả bản đã lọc để không đưa proof cũ trở lại UI.

Workspace dùng scope room+round+problem hoặc contest+problem. Không đọc/lưu nháp trong scope thi đấu. SUBMIT được ACK mới về starter, và chỉ khi revision chưa đổi. Chạy thử, lỗi server hoặc ACK đến sau khi người dùng đã gõ code mới không xóa code. Nếu ACK thất lạc, retry dùng cùng requestId; không suy đoán trạng thái để xóa. Practice cá nhân vẫn autosave. Đây là lựa chọn không lưu nháp thi đấu: phần đang gõ chưa submit cũng mất sau reload.

## Dataset và database migration

Giữ 120 mã v5 và thêm 200 mã v6 theo tỷ lệ 34 Arithmetic,34 Arrays,33 Strings,33 Number Theory,33 Sequences,33 Graphs. Mỗi bản đề công bố mới có năm test có nội dung, một ví dụ và bốn test ẩn. Bộ test cũ được chọn theo biên/độ đa dạng từ bản gốc 2.394 test; không sửa đề/đáp án gốc. Reference cũ là C++11; reference mới là Python 3.11; vẫn chấm được cả bốn ngôn ngữ.

Migration schema chỉ thêm V6. Chuyển dữ liệu giữ UUID, CG, bookmark và submission snapshot/verdict. Chỉ cập nhật đề khớp baseline chính xác sau khi bỏ metadata do server tạo. Khác nội dung thì CONFLICT; bank đã khóa/contest đang thi thì DEFERRED, thử lại sau trận. Không thu gọn snapshot lịch sử hoặc snapshot của trận đang diễn ra. Xác thực đáp án qua worker thật; không tự ghi AC/validatedVersion từ seed.

Trước khi cập nhật database dự án đã sao lưu riêng trong thư mục Temp của người dùng. Báo cáo [project-upgrade-v6.json](../statics/results/project-upgrade-v6.json) đối chiếu 120 UUID/mã, 314 snapshot/source/received_at, 314 verdict đã hoàn tất và 1.113 command response cũ. Những con số trước nâng cấp là số đọc từ database thật, không phải dữ liệu mô phỏng.

Database cũ còn một Contest chạy đến **14:05 ngày 31/10/2026 (UTC+7)**. Vì vậy 5 bài được giữ nguyên bộ test cũ: 315 bài đã chuẩn hóa, tổng database hiện tại 1.675 testcase. Source và database kiểm thử mới đều đạt 320 bài / 1.600 testcase. Timer tự thử nâng cấp sau khi Contest kết thúc; không tự hủy Contest để đạt số đếm. Trong thời gian này, các bài bị hoãn vẫn chấm được trong Contest và Practice bằng phiên bản legacy đang dùng.

## Experimental setup và kết quả

Windows host, Docker Linux VM 12 CPU / 8 GiB; Java 21, MySQL 8.4, Python 3.11, g++ hỗ trợ 11/17/20. H2 MySQL mode cho unit/integration backend, MySQL thật cho Compose. JSDOM chạy bundle React thực và mở WebSocket thật; không dùng nó để đánh giá CSS hay kích thước hiển thị native.

| Nhóm | Kết quả thực tế | Nguồn |
|---|---|---|
| Backend | 91 test, 0 failure/error/skip | verification-v6.json / Surefire |
| Frontend | 68 test và Vite build đạt | verification-v6.json |
| UI/server | 7 hành trình DOM đạt | survival-v6-ui.json |
| Reference | 1.000 test Python + 1.800 C++ + 125 kiểm tra độc lập | dataset-v6-verification.json |
| Judge thật | AC CPP11/17/20/PY311; WA,CE,TLE | judge-v6-smoke.json |
| Ba mode thật | Practice 2 không EXP; Normal/Ranked: 100 + 4×20 EXP | exp-policy-smoke.json |
| Restart | Session/queue/joinedAt và mã/version giữ nguyên | restart-v6.json |
| PING | 820 ACK, 1/10/30 kết nối | network-v6.json |
| Fairness | 10.000 mô phỏng: baseline sai 6.151, proposed sai 0 | fairness-v6.json |

Các file nằm ở [statics/results](../statics/results). PING p95 tương ứng 14,362 / 18,084 / 200,664 ms chỉ đo round trip protocol trong môi trường đang chạy các tác vụ Docker khác. Không suy ra tải judge/matcher hoặc độ trễ Internet từ kết quả này. Fairness dùng production ranking function nhưng là mô phỏng seeded, không phải đo trên người chơi thật. Native Edge automation bị môi trường chặn, không có kết quả PASS/screenshot cho phần đó.

## Novelty / Contributions

| Đóng góp tích hợp | Bằng chứng implementation và test |
|---|---|
| Command ledger + ACK sau commit + replay | Commands, ClientSocket, test idempotence/socket/reconnect |
| Cutoff tách khỏi worker completion | RoundRanking/Survival, fairness và test final worker đảo thứ tự |
| Engine ba mode với queue durable năm người | Matchmaking/Survival, test 2–10 Practice, 4/5/6/15 queue, accept/cancel race và smoke thật |
| Settlement Elo/EXP đúng một lần | Progression, unique keys, tests tie/forfeit/first AC/replay |
| Nâng cấp ngân hàng không reset lịch sử | SeedBankExpansion, fingerprint database trước/sau và restart |
| Editor bảo vệ ACK muộn | Workspace DOM tests cho submit lỗi, trial, scope mới và code mới |

Elo, gamification, WebSocket, Docker và các thuật toán đề đều là kiến thức có sẵn. Đóng góp là thiết kế tích hợp và kiểm chứng trong phạm vi ứng dụng; không tuyên bố nhóm phát minh các thuật toán đó.

## Hạn chế và hướng tiếp theo

Khóa toàn cục chưa phù hợp tải rất lớn; chưa có HA nhiều máy, anti-cheat hoàn chỉnh, nghiên cứu hiệu quả học tập, đánh giá native layout/accessibility hay chứng minh năm test bao phủ mọi lỗi. Một số reference dùng vét cạn dưới giới hạn nhỏ. Xung đột AUTHOR cần chủ sở hữu xử lý. Worker hiện biên dịch/chạy container riêng từng test nên validation bank lần đầu có thể lâu; đã tránh để batch validation chặn bài thi thật.

Hướng tiếp theo: benchmark matcher/judge có kiểm soát tải; lease phục hồi khi failover nhiều server; mở rộng testcase có hệ thống ngoài giới hạn hiện tại nếu yêu cầu thay đổi; kiểm tra native mobile/accessibility; kiểm định chất lượng ngân hàng và đánh giá học tập với người dùng.

## Files và tài liệu tái lập

[changes-v6.json](../statics/results/changes-v6.json) liệt kê toàn bộ file thêm/sửa/xóa, gồm 320 source lời giải; không tính hai file architecture.png/svg đã bị xóa trước phiên làm việc. Các entry chính là Matchmaking.java, Progression.java, SeedBankExpansion.java, V6 migration, Survival/Commands/Submissions/QuestionRules/Catalog, SurvivalLobby/Survival/Workspace/Community/QuestionEditor, script generate/verify/smoke và tests.

[README](../README.md) có lệnh chạy Compose, biến cấu hình, demo và cách tái lập. [solutions/index.json](../solutions/index.json) là mục lục thuật toán. Việc nộp/kiểm tra học thuật và cập nhật Word chính thức do nhóm xác nhận theo [INSTRUCTION](../INSTRUCTION.md).
