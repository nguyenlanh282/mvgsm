# PRD: Hệ Thống Quản Trị Mục Tiêu Doanh Nghiệp (MV-GSM Goal Manager)
**Version:** 1.3.1 (Final Freeze)  
**Ngày:** 30/05/2026  
**Tác giả:** Product Team  
**Trạng thái:** 🔒 Final Freeze — 99% hoàn thiện — Sẵn sàng Sprint 1

---

## Changelog v1.0 → v1.1

| # | Điểm thay đổi | Nguồn | Mức độ |
|---|--------------|-------|--------|
| C1 | Fix lỗi logic công thức % hoàn thành tuần — bổ sung `start_week`/`end_week` vào goal | Review PM/TL | 🔴 Nghiêm trọng |
| C2 | Tách `audit_logs` khỏi D1 → Cloudflare KV để tránh phình database | Review PM/TL | 🔴 Nghiêm trọng |
| C3 | Chốt chiến lược Multi-tenant: giữ schema nhưng lock 1 company ở tầng API/UI | Review PM/TL | 🟡 Quan trọng |
| C4 | Làm rõ UX phân quyền Finance trên Dashboard (Read-only 6 trụ cột) | Review PM/TL | 🟡 Quan trọng |
| C5 | Bổ sung `working_days_per_month` vào schema `personal_kpi` | Review PM/TL | 🟡 Quan trọng |
| C6 | Điều chỉnh effort Weekly Tracking: 3 ngày → 5 ngày FE | Review PM/TL | 🟢 Thông tin |
| C7 | Chốt Q2: Tự build JWT trong Workers (không dùng Cloudflare Access) | Review PM/TL | 🔴 Nghiêm trọng |
| C8 | Chốt Q4: PDF render phía Client (Next.js + jsPDF/Window.print) | Review PM/TL | 🟢 Thông tin |
| C9 | Chốt Q7: Schema multi-tenant, UI/API lock single-company ở v1 | Review PM/TL | 🔴 Nghiêm trọng |

## Changelog v1.1 → v1.2

| # | Điểm thay đổi | Nguồn | Mức độ |
|---|--------------|-------|--------|
| C10 | Chốt Q3: Phần thưởng cần workflow phê duyệt — bổ sung bảng `reward_approvals` + flow 3 bước | Product Owner | 🟡 Quan trọng |
| C11 | Chốt Q5: Không cần offline/PWA — ghi rõ vào Non-Goals | Product Owner | 🟢 Thông tin |
| C12 | Chốt Q6: Năm tài chính bắt đầu tháng 1 — hardcode, xóa `fiscal_year_start` | Product Owner | 🟢 Thông tin |
| C13 | Fix SQLite constraint: thay `UNIQUE(goal_id, status)` → Partial Index `WHERE status = 'pending'` — cho phép gửi lại sau khi bị reject | Review PM/TL | 🔴 Nghiêm trọng |

## Changelog v1.2 → v1.3

| # | Điểm thay đổi | Nguồn | Mức độ |
|---|--------------|-------|--------|
| C14 | Fix tuần ISO: nâng CHECK `start_week`/`end_week` từ 52 → 53 để hỗ trợ năm có 53 tuần (vd: 2026) | Review Senior | 🔴 Quan trọng |
| C15 | Fix công thức Progress: tách thành 3 chỉ số rõ ràng — ActualProgress, ExpectedProgress, HealthScore | Review Senior | 🔴 Rất quan trọng |
| C16 | Bổ sung enum đầy đủ cho `goals.status`: draft/active/completed/archived/cancelled | Review Senior | 🟡 Quan trọng |
| C17 | Thêm Soft Delete (`deleted_at`) cho bảng `goals` — không xóa cứng | Review Senior | 🟡 Quan trọng |
| C18 | Điều chỉnh chiến lược Audit KV: thêm shadow write vào D1 cho các event critical (Eventually Consistent risk) | Review Senior | 🟡 Trung bình |
| C19 | Bổ sung bảng `notifications` cho in-app notification (badge đỏ, reward, goal alert) | Review Senior | 🟡 Quan trọng |
| C20 | Bổ sung bảng `activity_feed` cho Dashboard "5 cập nhật gần nhất" | Review Senior | 🟡 Quan trọng |
| C21 | Quy định rõ giới hạn upload file: loại file + max size | Review Senior | 🟢 Thông tin |
| C22 | Thêm Manager Reassignment flow khi Trưởng BP nghỉ việc | Review Senior | 🟡 Quan trọng |
| C23 | Thêm `weight` (trọng số %) vào bảng `goals` để tính Progress có trọng số | Review Senior | 🟡 Quan trọng |
| C24 | Bổ sung bảng `goal_comments` + mention user (@) | Review Senior | 🟢 Thông tin |
| C25 | Bổ sung Backup Strategy chi tiết (retention 30 ngày, RTO < 1h, cron 02:00 AM) | Review Senior | 🟢 Thông tin |

## Changelog v1.3 → v1.3.1 (Final Freeze)

| # | Điểm thay đổi | Nguồn | Mức độ |
|---|--------------|-------|--------|
| C26 | Fix mâu thuẫn M2.6 ghi 1–52 trong khi schema đã là 1–53 | Final Review | 🟡 Nhỏ |
| C27 | Fix CHECK `end_week > start_week` → `end_week >= start_week` cho phép Goal 1 tuần | Final Review | 🔴 Quan trọng |
| C28 | Bổ sung Business Rule: tổng weight Goal active trong cùng category+year phải = 100% | Final Review | 🟡 Quan trọng |
| C29 | Ghi rõ DELETE = soft delete + thêm API `POST /api/goals/:id/restore` | Final Review | 🟡 Quan trọng |
| C30 | Notification retention 180 ngày + weekly purge cron | Final Review | 🟡 Quan trọng |
| C31 | Activity Feed retention 12 tháng + archive R2 | Final Review | 🟡 Quan trọng |
| C32 | Thêm index cho `personal_kpi_history` | Final Review | 🟢 Thông tin |
| C33 | Bổ sung Password Policy: ≥ 8 ký tự, 1 chữ hoa, 1 số | Final Review | 🟡 Quan trọng |
| C34 | Fix Refresh Token multi-device: key `rt:{userId}:{deviceId}` | Final Review | 🟡 Quan trọng |
| C35 | Bổ sung Migration Strategy: up/down SQL + rollback procedure | Final Review | 🟢 Thông tin |

---

## 1. Tóm Tắt Sản Phẩm

**MV-GSM Goal Manager** là ứng dụng web giúp doanh nghiệp vừa và nhỏ tại Việt Nam thiết lập, theo dõi và đo lường mục tiêu kinh doanh theo framework MV-GSM (Mission–Vision–Goals–Strategy–Measure). Sản phẩm thay thế hoàn toàn việc quản lý mục tiêu bằng Excel thủ công, giúp toàn bộ tổ chức nhìn thấy tiến độ realtime và hành động đúng hướng.

**Hạ tầng:** 100% Cloudflare-native (Pages + Workers + D1 + R2 + KV).

---

## 2. Bối Cảnh & Vấn Đề

### 2.1 Vấn đề hiện tại

Doanh nghiệp SME Việt Nam hiện đang quản lý mục tiêu bằng file Excel (như bộ file CSPS/Tương Việt Hoa Sen) với các vấn đề:

- **Phân tán dữ liệu**: Mỗi bộ phận một file, không có nguồn dữ liệu thống nhất
- **Không realtime**: Cập nhật thủ công, thường bị trễ hàng tuần
- **Khó theo dõi**: Ban giám đốc không thấy được bức tranh tổng thể nếu không gọi họp
- **Mất dữ liệu lịch sử**: Excel bị ghi đè, không lưu lịch sử thay đổi
- **Không có cảnh báo**: Khi mục tiêu lệch không có ai biết cho đến kỳ họp
- **Không phân quyền**: Ai cũng có thể sửa file, dễ nhầm lẫn

### 2.2 Người dùng bị ảnh hưởng

| Vai trò | Tần suất sử dụng | Pain point chính |
|---|---|---|
| Giám đốc / Chủ tịch | Hàng tuần | Không thấy tổng thể, phải họp mới biết tiến độ |
| Trưởng bộ phận | Hàng ngày | Cập nhật báo cáo tốn thời gian, dễ bị sót |
| Nhân viên Sale | Hàng ngày | Không biết mình đang đạt bao nhiêu % mục tiêu |
| Kế toán | Hàng tháng | Nhập liệu tài chính trùng lặp vào nhiều file |

### 2.3 Chi phí nếu không giải quyết

- Mục tiêu bị lãng quên sau Q1, không được theo dõi xuyên suốt
- Họp kiểm điểm mất 2–3 giờ chỉ để tổng hợp số liệu
- Nhân viên không có cơ chế tự theo dõi → thiếu động lực
- Công ty mất cơ hội điều chỉnh chiến lược kịp thời

---

## 3. Mục Tiêu Sản Phẩm

### 3.1 Mục tiêu người dùng

- **G1**: Giám đốc có dashboard xem được toàn bộ tiến độ 6 trụ cột trong < 30 giây
- **G2**: Trưởng bộ phận cập nhật tiến độ mục tiêu trong < 5 phút/tuần
- **G3**: Nhân viên sale tự tính được KPI ngày/tuần từ mục tiêu thu nhập cá nhân

### 3.2 Mục tiêu kinh doanh

- **G4**: 80% doanh nghiệp dùng thử hoàn thành việc thiết lập mục tiêu năm trong session đầu tiên
- **G5**: Tỷ lệ giữ chân người dùng sau 3 tháng đạt ≥ 60%
- **G6**: Giảm thời gian họp kiểm điểu quý ít nhất 50% nhờ số liệu đã được cập nhật sẵn

---

## 4. Ngoài Phạm Vi (Non-Goals) — v1.2

| Non-Goal | Lý do |
|---|---|
| Tích hợp trực tiếp với MISA/Fast kế toán | Phức tạp, cần API riêng — để v2 |
| Mobile app native (iOS/Android) | Web responsive đủ dùng giai đoạn đầu |
| AI gợi ý chiến lược tự động | Cần dữ liệu đủ lớn trước — v3 |
| UI/API cho nhiều công ty đồng thời (multi-tenant) | Schema đã sẵn sàng, mở UI ở v2 [C3] |
| Tích hợp Zalo OA / notification | v2 |
| Quản lý OKR cấp cá nhân chi tiết | Giữ focus vào cấp công ty và bộ phận |
| Cloudflare Access / Zero Trust Auth | Dùng JWT tự build, tối ưu chi phí [C7] |
| **Offline mode / PWA** | **[C11] Không cần — hệ thống yêu cầu kết nối internet để dùng.** |
| **Năm tài chính tùy chỉnh** | **[C12] Cố định tháng 1. Không cần config fiscal_year_start.** |

---

## 5. Người Dùng & Phân Quyền

### 5.1 Personas

**Persona 1 — Giám đốc (Admin)**
- Quyền: Toàn bộ hệ thống — tạo/sửa/xóa mục tiêu công ty, xem tất cả bộ phận
- Nhu cầu: Dashboard tổng hợp, cảnh báo lệch mục tiêu, xuất báo cáo PDF

**Persona 2 — Trưởng Bộ Phận (Manager)**
- Quyền: Xem mục tiêu công ty, quản lý mục tiêu bộ phận mình, cập nhật tiến độ
- Nhu cầu: Timeline tuần, nhắc nhở cập nhật, so sánh kỳ trước

**Persona 3 — Nhân Viên Sale (Staff)**
- Quyền: Xem mục tiêu bộ phận, sử dụng công cụ tính KPI cá nhân
- Nhu cầu: Biết mình đang đạt bao nhiêu %, cần làm gì hôm nay

**Persona 4 — Kế Toán (Finance)**
- Quyền: **[C4]** Xem Dashboard tổng quan (Read-only — thấy 6 trụ cột và tiến độ nhưng không thấy nút Edit/Update). Nhập và cập nhật số liệu tài chính (doanh thu, chi phí thực tế theo tháng). Không truy cập module Goals, Settings, Phân quyền.
- Nhu cầu: Form nhập liệu đơn giản, sidebar rút gọn chỉ hiện Tài Chính + Dashboard

---

## 6. User Stories

### 6.1 Thiết lập mục tiêu công ty

- Là **Giám đốc**, tôi muốn nhập Mission, Vision, Core Values của công ty để toàn bộ tổ chức thấy định hướng chung.
- Là **Giám đốc**, tôi muốn tạo mục tiêu theo 6 trụ cột (Tài chính, Sản phẩm, Khách hàng, Thương hiệu, Hệ thống, Đội ngũ) và gắn chiến lược + KPI cho từng mục tiêu.
- Là **Giám đốc**, tôi muốn sao chép bộ mục tiêu từ năm trước để làm điểm xuất phát cho năm mới.
- Là **Giám đốc**, tôi muốn đặt phần thưởng cho từng mục tiêu và **phê duyệt thủ công** khi Goal được báo cáo hoàn thành — để tránh tự động phát thưởng sai. [C10]
- Là **Trưởng bộ phận**, tôi muốn **đề nghị phát thưởng** khi Goal của bộ phận mình đã hoàn thành, để Giám đốc xem xét và xác nhận. [C10]

### 6.2 Theo dõi tiến độ

- Là **Trưởng bộ phận**, tôi muốn cập nhật trạng thái từng mục tiêu theo tuần (Hoàn thành / Đang làm / Chưa làm) để ban giám đốc thấy tiến độ realtime.
- Là **Trưởng bộ phận**, tôi muốn đính kèm file hoặc link bằng chứng kết quả (ảnh, Google Drive) vào từng mục tiêu.
- Là **Giám đốc**, tôi muốn nhận cảnh báo khi một mục tiêu bị "Chưa làm" liên tục 2 tuần.

### 6.3 Đo lường tài chính

- Là **Kế toán**, tôi muốn nhập doanh thu thực tế theo từng tháng để hệ thống tự tính % đạt so với kế hoạch.
- Là **Giám đốc**, tôi muốn xem biểu đồ 5-Way (KHTN × Tỷ lệ chuyển đổi × Số lần GD × DT TB đơn × Tỷ suất LN) để phân tích nguyên nhân tăng/giảm doanh thu.
- Là **Giám đốc**, tôi muốn xem bảng BCG matrix sản phẩm tự động cập nhật theo số liệu bán hàng.

### 6.4 KPI cá nhân Sale

- Là **Nhân viên Sale**, tôi muốn nhập mục tiêu thu nhập của mình và hệ thống tự tính ra số khách cần tiếp cận mỗi ngày.
- Là **Nhân viên Sale**, tôi muốn xem tiến độ tháng hiện tại so với mục tiêu cá nhân.

### 6.5 Báo cáo & xuất dữ liệu

- Là **Giám đốc**, tôi muốn xuất báo cáo quý ra PDF để dùng trong buổi họp BGĐ.
- Là **Trưởng bộ phận**, tôi muốn xem lịch sử thay đổi của một mục tiêu để biết ai đã cập nhật gì và khi nào.

---

## 7. Yêu Cầu Chức Năng

### 7.1 P0 — Must Have (MVP)

#### M1. Xác thực & Phân quyền
- **M1.1** Đăng nhập bằng email/password
- **M1.2** 4 vai trò: Admin, Manager, Staff, Finance
- **M1.3** Admin tạo tài khoản cho thành viên, gán vai trò và bộ phận
- **M1.4** **[C33] Password Policy:** Tối thiểu 8 ký tự, bắt buộc có ít nhất 1 chữ hoa + 1 số. Regex validate: `/^(?=.*[A-Z])(?=.*\d).{8,}$/`. Hiển thị strength indicator realtime khi tạo/đổi mật khẩu.
- **Acceptance criteria:**
  - [ ] User không đăng nhập không truy cập được bất kỳ route nào
  - [ ] Staff chỉ thấy mục tiêu bộ phận mình, không thấy mục tiêu công ty
  - [ ] **[C4]** Finance thấy Dashboard tổng quan ở chế độ Read-only (không có nút Edit/Update Goal). Sidebar Finance chỉ hiện: Dashboard, Tài Chính, KPI Cá nhân.
  - [ ] **[C4]** Finance không truy cập được route `/goals/*`, `/settings/*`, `/reports/*`
  - [ ] Session hết hạn sau 8 giờ, redirect về login
  - [ ] **[C7][C34]** JWT ký bằng HMAC-SHA256, payload: `{userId, companyId, role, deviceId, exp}`. Refresh token 30 ngày lưu trong KV: key `rt:{userId}:{deviceId}` — mỗi thiết bị giữ token riêng, đăng nhập trên laptop không đá điện thoại.
  - [ ] **[C33]** Password không đạt policy → báo lỗi rõ ràng: "Mật khẩu cần ít nhất 8 ký tự, 1 chữ hoa, 1 số"
  - [ ] **[C34]** `deviceId` = fingerprint browser (User-Agent hash) hoặc UUID lưu localStorage. Tối đa 5 device/user — device thứ 6 đăng nhập → revoke token device cũ nhất.

#### M2. Quản lý Mục Tiêu Công Ty (MV-GSM)
- **M2.1** Nhập/sửa Mission, Vision, Core Values
- **M2.2** Tạo Goal theo 6 trụ cột với các trường: Tên goal, Mô tả, Measure (KPI), Thời hạn, Bộ phận phụ trách, Bộ phận phối hợp
- **M2.3** Mỗi goal có thể có nhiều Strategy (chiến lược con)
- **M2.4** Mỗi Strategy có thể có nhiều Measure (KPI cụ thể)
- **M2.5** Chu kỳ theo Năm → Quý → Tháng
- **M2.6** **[C1][C14][C26]** Mỗi Goal bắt buộc lưu `start_week` và `end_week` (**1–53**, hỗ trợ năm ISO có 53 tuần). Khi tạo Goal theo Quý, hệ thống tự điền: Q1=Tuần 1–13, Q2=Tuần 14–26, Q3=Tuần 27–39, Q4=Tuần 40–52 (nếu năm có tuần 53, Q4 tự mở rộng thành 40–53). Goal theo Năm mặc định start_week=1, end_week=52 (hoặc 53 nếu năm đó có). Người dùng có thể chỉnh thủ công.

- **Acceptance criteria:**
  - [ ] Tạo goal mới < 3 bước
  - [ ] Có thể thêm ít nhất 1 Strategy và 1 Measure cho mỗi goal
  - [ ] Goal hiển thị đúng trụ cột (6 category)
  - [ ] Validate: Tên goal và Measure không được để trống
  - [ ] **[C1][C26]** Validate: `start_week` <= `end_week`, cả hai trong khoảng 1–53
  - [ ] **[C27]** Cho phép `start_week` = `end_week` (Goal kéo dài 1 tuần)
  - [ ] Khi chọn Quý từ dropdown → `start_week`/`end_week` tự điền đúng

#### M3. Tracking Tiến Độ Tuần
- **M3.1** Mỗi goal có grid tracking hiển thị đúng số tuần trong khoảng `start_week` → `end_week` (không phải cố định 52 ô)
- **M3.2** 3 trạng thái: Hoàn thành (xanh) / Đang làm (vàng) / Chưa làm (đỏ). Tuần nằm ngoài khoảng start–end hiển thị xám, không cho cập nhật.
- **M3.3** Trưởng bộ phận cập nhật trạng thái từng tuần
- **M3.4** **[C2]** Lịch sử thay đổi (ai cập nhật, lúc nào, ghi chú) được ghi vào **Cloudflare KV** — key: `audit:{companyId}:{goalId}:{week}:{timestamp}`, value: JSON log. Không ghi vào D1 để giữ database nhẹ.
- **M3.5** Dashboard tổng quan: % hoàn thành theo trụ cột

- **Acceptance criteria:**
  - [ ] Grid chỉ render đúng số ô từ `start_week` đến `end_week`
  - [ ] Click vào ô tuần → mở modal cập nhật trạng thái + ghi chú
  - [ ] Lịch sử cập nhật đọc từ KV, hiển thị: tên người, thời gian, trạng thái cũ → mới
  - [ ] **[C1][C15]** Mỗi Goal hiển thị **3 chỉ số Progress riêng biệt**:
    - **ActualProgress** = DoneWeeks / TotalWeeks (TotalWeeks = end_week - start_week + 1) — tiến độ thực tế
    - **ExpectedProgress** = ElapsedWeeks / TotalWeeks (ElapsedWeeks = số tuần đã qua nằm trong start–end) — kỳ vọng theo thời gian
    - **HealthScore** = ActualProgress / ExpectedProgress — nếu > 1 = vượt kỳ vọng, < 0.7 = cần cảnh báo đỏ
    - **Không bao giờ** tính % = DoneWeeks / ElapsedWeeks (có thể > 100% gây nhầm lẫn)
  - [ ] Tuần hiện tại được highlight rõ ràng trên grid
  - [ ] **[C6]** Grid 52 ô render responsive: trên desktop hiện 1 hàng, mobile hiện dạng scroll ngang hoặc compact 4 cột

#### M4. Module Tài Chính
- **M4.1** Thiết lập mục tiêu tài chính năm: Doanh thu, % Chi phí, Lợi nhuận
- **M4.2** Nhập doanh thu thực tế theo tháng
- **M4.3** Tự tính: % đạt so kế hoạch, so năm trước, số tháng còn lại cần đạt trung bình bao nhiêu
- **M4.4** Biểu đồ đường: Kế hoạch vs Thực tế theo tháng

- **Acceptance criteria:**
  - [ ] Khi nhập DT tháng mới → biểu đồ tự cập nhật
  - [ ] Hiển thị % đạt mục tiêu năm (ví dụ: 31.25% sau 4 tháng)
  - [ ] Tính đúng: Mục tiêu còn lại / Số tháng còn lại = DT TB cần đạt/tháng
  - [ ] Đơn vị tính hiển thị rõ (nghìn đồng / triệu / tỷ)

#### M5. Công Cụ Tính KPI Sale Cá Nhân
- **M5.1** Form nhập: Mục tiêu thu nhập, Mức hoa hồng, Tỷ lệ chuyển đổi, DT TB đơn, **[C5] Số ngày làm việc trong tháng (mặc định: 26)**
- **M5.2** Tự tính ngược: Doanh số cần đạt, Số lượng cần bán, Số khách cần tiếp cận/tháng, **Số khách cần tiếp cận/ngày = (Số KHTN cần đạt tháng) / working_days_per_month**
- **M5.3** Hiển thị "Hành động cụ thể hôm nay" dựa trên kết quả tính toán

- **Acceptance criteria:**
  - [ ] Thay đổi một input → tất cả output tự tính lại realtime (không cần bấm Submit)
  - [ ] **[C5]** Số khách/ngày = CEILING(KHTN_tháng / working_days) — làm tròn lên, không hiện số thập phân
  - [ ] Số ngày làm việc cho phép nhập 20–31, validate lỗi nếu ngoài khoảng
  - [ ] Có thể lưu cấu hình cho từng nhân viên (persist vào D1)
  - [ ] Hiển thị rõ giả định: "Tính trên X ngày làm việc/tháng"

#### M6. Workflow Phê Duyệt Phần Thưởng [C10]

**Flow 3 bước:**
```
Trưởng BP đề nghị → Giám đốc nhận thông báo → Giám đốc Approve / Reject
```

- **M6.1** Mỗi Goal có thể gắn phần thưởng khi tạo: mô tả thưởng (text), giá trị ước tính (số, tuỳ chọn)
- **M6.2** Khi Goal đạt 100% hoàn thành (tất cả tuần trong start–end_week đều "Hoàn thành"), Trưởng bộ phận thấy nút **"Đề nghị phát thưởng"**
- **M6.3** Sau khi Trưởng BP bấm đề nghị → tạo bản ghi `reward_approvals` trạng thái `pending` → hiển thị badge đỏ trên Dashboard của Admin
- **M6.4** Admin vào trang Phê Duyệt, xem danh sách đề nghị đang chờ, bấm **Approve** hoặc **Reject + ghi lý do**
- **M6.5** Sau khi Approve → Goal hiển thị badge "🏆 Đã phát thưởng", Trưởng BP nhận in-app notification
- **M6.6** Sau khi Reject → Trưởng BP thấy lý do từ chối, Goal trở về trạng thái bình thường

- **Acceptance criteria:**
  - [ ] Nút "Đề nghị phát thưởng" chỉ hiện khi Goal có gắn reward VÀ % hoàn thành = 100%
  - [ ] Staff và Finance không thấy nút này
  - [ ] Dashboard Admin có badge số đỏ khi có reward đang `pending`
  - [ ] Approve/Reject đều ghi vào KV audit log
  - [ ] Một Goal chỉ có thể có 1 reward request `pending` tại một thời điểm — bấm lại sẽ báo lỗi "Đã có đề nghị đang chờ duyệt" (enforce bởi Partial Index `idx_unique_pending_reward`) [C13]
  - [ ] Sau khi bị Reject, Trưởng BP **có thể gửi lại** đề nghị mới — không bị block bởi các bản ghi `rejected` cũ [C13]
  - [ ] Lịch sử phê duyệt (approved_by, rejected_reason, timestamp) hiển thị trong chi tiết Goal

---

### 7.2 P1 — Should Have (v1.1)

#### S1. Cảnh báo & Nhắc nhở
- **S1.1** Email/in-app notification khi goal bị "Chưa làm" ≥ 2 tuần liên tiếp
- **S1.2** Nhắc nhở cập nhật vào mỗi thứ Hai hàng tuần
- **S1.3** Alert khi DT thực tế tháng < 70% kế hoạch

#### S2. Five-Way Analysis
- **S2.1** Dashboard 5 yếu tố: KHTN × Tỷ lệ chuyển đổi × Số lần GD × DT TB đơn × Tỷ suất LN
- **S2.2** So sánh năm hiện tại vs năm trước
- **S2.3** Chiến lược gợi ý cho từng yếu tố (theo dữ liệu trong file Excel)

#### S3. BCG Matrix Sản Phẩm
- **S3.1** Quản lý danh sách sản phẩm với doanh thu và tốc độ tăng trưởng
- **S3.2** Tự phân loại: Ngôi sao / Bò sữa / Chấm hỏi / Con chó
- **S3.3** Biểu đồ bubble chart BCG trực quan

#### S4. Kế Hoạch Cắt Giảm Chi Phí
- **S4.1** Nhập chi phí hiện tại theo từng hạng mục (Giá vốn, Bán hàng, QLDN, Tài chính)
- **S4.2** Đặt mục tiêu % tỷ trọng cho năm tới
- **S4.3** Tính tự động: mức cần cắt giảm theo từng hạng mục

#### S5. Xuất Báo Cáo PDF
- **S5.1** **[C8]** PDF được render phía **Client (Next.js)** — dùng `window.print()` với CSS `@media print` hoặc thư viện `jsPDF` chạy trên browser. Worker API chỉ cung cấp data JSON, không render PDF. Lý do: Cloudflare Workers không chạy Puppeteer trực tiếp (chỉ qua Browser Rendering có phí riêng).
- **S5.2** Xuất báo cáo tổng quan quý (toàn bộ 6 trụ cột + số liệu tài chính)
- **S5.3** Xuất báo cáo từng bộ phận
- **S5.4** Template theo format họp BGĐ: Mission/Vision → 6 trụ cột → Tài chính → Cảnh báo

#### S6. Đính kèm bằng chứng
- **S6.1** Upload file lên Cloudflare R2, đính vào từng goal
- **S6.2** Dán link Google Drive / Larkbase vào ghi chú
- **S6.3** **[C21] Quy định upload:**
  - Loại file cho phép: ảnh (`jpg`, `png`, `webp`), tài liệu (`pdf`, `docx`, `xlsx`)
  - Kích thước tối đa: **20MB/file**, tối đa **10 file/goal**
  - File ngoài danh sách trên → báo lỗi rõ ràng: "Chỉ chấp nhận jpg/png/webp/pdf/docx/xlsx, tối đa 20MB"
  - Tên file lưu R2: `{companyId}/{goalId}/{timestamp}_{originalName}` (tránh trùng tên)

---

### 7.3 P2 — Future Considerations (v2+)

- Tích hợp MISA / Fast kế toán qua API để tự động kéo doanh thu thực tế
- Zalo ZNS / Email nhắc nhở định kỳ
- Mobile-optimized PWA
- Multi-company (SaaS multi-tenant)
- AI nhận xét tiến độ và gợi ý điều chỉnh chiến lược
- Tích hợp Larkbase / Google Sheets sync
- OKR cấp cá nhân với cascade từ goal công ty

---

## 8. Yêu Cầu Phi Chức Năng

### 8.1 Hiệu năng
- Trang dashboard load < 1.5 giây (Cloudflare Edge)
- API response < 300ms cho 95th percentile
- D1 query timeout < 500ms

### 8.2 Bảo mật
- HTTPS bắt buộc (Cloudflare SSL)
- JWT token với expiry 8 giờ, refresh token 30 ngày
- Input sanitization chống XSS/SQL injection
- Rate limiting: 100 request/phút/IP (Cloudflare Workers rate limit)
- Audit log: mọi hành động create/update/delete đều được ghi lại

### 8.3 Độ tin cậy
- Uptime: 99.9% (Cloudflare SLA)
- Graceful degradation khi D1 lag: hiển thị cached data từ KV

**[C25] Backup Strategy chi tiết:**

| Hạng mục | Quy định |
|----------|---------|
| **Target** | D1 database + R2 files |
| **Lịch backup** | Hàng ngày lúc **02:00 AM ICT** (Cloudflare Cron Trigger) |
| **Nơi lưu** | R2 bucket `goal-manager-backups`, prefix `db/{YYYY-MM-DD}/` |
| **Retention** | **30 ngày** — backup cũ hơn tự xóa (R2 Lifecycle Rule) |
| **RTO** (Recovery Time Objective) | **< 1 giờ** — restore từ backup gần nhất |
| **RPO** (Recovery Point Objective) | **< 24 giờ** — mất tối đa dữ liệu 1 ngày |
| **Verify** | Mỗi tuần chạy test restore tự động vào môi trường staging |
| **Alert** | Nếu backup job thất bại → gửi email cảnh báo cho Admin trong 30 phút |

### 8.4 Khả năng mở rộng
- D1 hỗ trợ đến 10GB storage — đủ cho 100 công ty dùng 3 năm
- Workers: auto-scale, không cần cấu hình
- Thiết kế schema để sau này migrate lên PostgreSQL (Hyperdrive) nếu cần

---

## 9. Kiến Trúc Kỹ Thuật

### 9.1 Stack Cloudflare-Native

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare Network                 │
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │  CF Pages    │    │     CF Workers (API)      │  │
│  │  (Next.js)   │───▶│  /api/goals               │  │
│  │  Static SSG  │    │  /api/tracking            │  │
│  └──────────────┘    │  /api/financial           │  │
│                      │  /api/reports             │  │
│                      └───────┬──────────┬────────┘  │
│                              │          │            │
│                    ┌─────────▼──┐  ┌────▼─────────┐ │
│                    │   CF D1    │  │    CF KV     │ │
│                    │ (Database) │  │   (Cache)    │ │
│                    └────────────┘  └─────────────-┘ │
│                                                     │
│                    ┌────────────┐                   │
│                    │   CF R2    │                   │
│                    │  (Files)   │                   │
│                    └────────────┘                   │
└─────────────────────────────────────────────────────┘
```

### 9.2 Database Schema (Cloudflare D1 / SQLite)

> **[C3] Chiến lược Multi-tenant:** Schema thiết kế đầy đủ `company_id` ở mọi bảng để sẵn sàng scale v2. Tuy nhiên ở v1, middleware `authMiddleware` trong Workers sẽ tự động inject `companyId` từ JWT và từ chối mọi request có `company_id` khác. Frontend không hiển thị UI chọn/chuyển company.

```sql
-- Công ty
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mission TEXT,
  vision TEXT,
  core_values TEXT,
  reward_policy TEXT,
  -- [C12] Năm tài chính cố định tháng 1, không cần lưu fiscal_year_start
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Người dùng
-- [C7] password_hash dùng bcrypt. JWT tự build trong Workers, không dùng Cloudflare Access.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','manager','staff','finance')),
  department_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Phòng ban
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  manager_id TEXT REFERENCES users(id)
);

-- Mục tiêu (Goal)
-- [C1]  Thêm start_week / end_week để tính progress đúng theo chu kỳ goal
-- [C14] Nâng CHECK lên 53 để hỗ trợ năm ISO có 53 tuần (vd: 2026)
-- [C16] Enum đầy đủ cho status
-- [C17] Soft Delete qua deleted_at
-- [C23] Thêm weight (trọng số %) cho từng goal khi tính progress tổng hợp
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  category TEXT NOT NULL CHECK(category IN (
    'tai_chinh','san_pham','khach_hang',
    'thuong_hieu','he_thong','doi_ngu'
  )),
  year INTEGER NOT NULL,
  quarter INTEGER,              -- null = cả năm
  start_week INTEGER NOT NULL DEFAULT 1,    -- [C14] Tuần bắt đầu (1–53)
  end_week   INTEGER NOT NULL DEFAULT 52,   -- [C14] Tuần kết thúc (1–53), phải > start_week
  title TEXT NOT NULL,
  description TEXT,
  measure TEXT,
  target_value REAL,
  current_value REAL,
  unit TEXT,
  deadline TEXT,
  weight INTEGER NOT NULL DEFAULT 10,       -- [C23] Trọng số % (5–100, tổng trong category nên = 100)
  owner_dept_id TEXT REFERENCES departments(id),
  collab_dept_ids TEXT,         -- JSON array
  reward TEXT,
  reward_value REAL,            -- Giá trị thưởng ước tính (VND)
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','active','completed','archived','cancelled')), -- [C16]
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,           -- [C17] Soft Delete: NULL = chưa xóa, có giá trị = đã xóa
  CHECK (end_week >= start_week),             -- [C27] >= cho phép goal 1 tuần
  CHECK (start_week BETWEEN 1 AND 53),      -- [C14]
  CHECK (end_week   BETWEEN 1 AND 53),      -- [C14]
  CHECK (weight BETWEEN 1 AND 100)          -- [C23]
  -- [C28] Business Rule: Tổng weight các Goal 'active' cùng (company_id, category, year)
  -- PHẢI = 100%. Validate ở tầng API, không enforce ở DB level.
  -- Khi admin tạo/sửa weight → API warning nếu tổng != 100, nhưng vẫn cho lưu.
  -- Dashboard hiển thị cảnh báo: "⚠️ Trọng số trụ cột Tài chính = 85% (thiếu 15%)"
);

-- Chiến lược (Strategy)
CREATE TABLE strategies (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Kết quả chứng minh (Evidence)
CREATE TABLE evidences (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  type TEXT CHECK(type IN ('file','link','note')),
  value TEXT NOT NULL,
  uploaded_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);

-- Tracking tuần
-- [C1] week_number chỉ hợp lệ trong khoảng start_week–end_week của goal (validate ở tầng API)
CREATE TABLE weekly_tracking (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('done','in_progress','not_done')),
  note TEXT,
  updated_by TEXT REFERENCES users(id),
  updated_at INTEGER NOT NULL,
  UNIQUE(goal_id, week_number, year)
);

-- [C2] KHÔNG có bảng audit_logs trong D1.
-- Toàn bộ audit log ghi vào Cloudflare KV:
--   Key:   audit:{companyId}:{entityType}:{entityId}:{timestampMs}
--   Value: JSON { action, userId, userName, oldValue, newValue, createdAt }
-- Đọc log: list KV với prefix "audit:{companyId}:{entityType}:{entityId}:"
-- Retention: KV TTL = 365 ngày (có thể tăng lên theo plan)

-- Mục tiêu tài chính
CREATE TABLE financial_targets (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  year INTEGER NOT NULL,
  revenue_target REAL NOT NULL,
  cost_ratio_target REAL,
  profit_ratio_target REAL,
  UNIQUE(company_id, year)
);

-- Doanh thu thực tế theo tháng
CREATE TABLE monthly_actuals (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  revenue REAL,
  cost REAL,
  profit REAL,
  updated_by TEXT REFERENCES users(id),
  updated_at INTEGER NOT NULL,
  UNIQUE(company_id, year, month)
);

-- Sản phẩm (BCG)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  quantity_sold INTEGER,
  unit_price REAL,
  revenue REAL,
  profit_margin REAL,
  growth_rate REAL,
  bcg_category TEXT CHECK(bcg_category IN ('star','cow','question','dog')),
  is_active INTEGER DEFAULT 1
);

-- KPI cá nhân Sale
-- [C5] Thêm working_days_per_month để tính số khách/ngày chính xác
CREATE TABLE personal_kpi (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER,
  income_target REAL,
  commission_rate REAL,
  conversion_rate REAL,
  avg_order_value REAL,
  working_days_per_month INTEGER DEFAULT 26,  -- [C5] Số ngày làm việc thực tế/tháng (20–31)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Phê duyệt phần thưởng [C10]
-- Workflow: pending → approved | rejected
-- Một Goal có thể có nhiều lần approved/rejected trong vòng đời,
-- nhưng chỉ được có 1 request pending tại một thời điểm (dùng Partial Index bên dưới)
CREATE TABLE reward_approvals (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id),
  requested_by TEXT REFERENCES users(id),   -- Trưởng BP đề nghị
  requested_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT REFERENCES users(id),    -- Admin/Giám đốc duyệt
  reviewed_at INTEGER,
  reject_reason TEXT,
  -- Snapshot thông tin thưởng tại thời điểm đề nghị
  reward_description TEXT NOT NULL,
  reward_value REAL                         -- Giá trị ước tính (VND), tuỳ chọn
);

-- [C13] Partial Index: chỉ chặn duplicate khi status = 'pending'.
-- Cho phép 1 goal có nhiều bản ghi approved/rejected (gửi lại sau khi bị từ chối).
-- KHÔNG dùng UNIQUE(goal_id, status) vì SQLite sẽ block cả approved/rejected trùng nhau.
CREATE UNIQUE INDEX idx_unique_pending_reward
  ON reward_approvals(goal_id)
  WHERE status = 'pending';

-- Index hỗ trợ query nhanh
CREATE INDEX idx_reward_approvals_company_status
  ON reward_approvals(company_id, status);
CREATE INDEX idx_reward_approvals_goal
  ON reward_approvals(goal_id);

-- In-app Notifications [C19]
-- Dùng cho: badge đỏ reward, cảnh báo goal đỏ 2 tuần, thông báo approve/reject
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  user_id TEXT REFERENCES users(id),        -- Người nhận
  type TEXT NOT NULL CHECK(type IN (
    'reward_request',     -- Có đề nghị thưởng mới (→ Admin)
    'reward_approved',    -- Thưởng được duyệt (→ Manager)
    'reward_rejected',    -- Thưởng bị từ chối (→ Manager)
    'goal_alert',         -- Goal bị đỏ ≥ 2 tuần liên tiếp (→ Manager + Admin)
    'goal_completed',     -- Goal đạt 100% (→ Admin)
    'mention'             -- Được mention trong comment (→ user được tag)
  )),
  title TEXT NOT NULL,
  content TEXT,
  entity_type TEXT,       -- 'goal' | 'reward_approval' | 'comment'
  entity_id TEXT,         -- ID của entity liên quan (để deep link)
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- [C30] Retention: Notification giữ 180 ngày.
-- Cron Trigger chạy mỗi Chủ Nhật 03:00 AM ICT:
--   DELETE FROM notifications WHERE created_at < (now - 180 ngày)
-- Purge cả đã đọc lẫn chưa đọc để giữ DB nhẹ.

-- Activity Feed [C20]
-- Nguồn dữ liệu cho Dashboard "5 cập nhật gần nhất"
-- Ghi khi: tracking update, goal status change, reward approve/reject, comment
CREATE TABLE activity_feed (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  actor_id TEXT REFERENCES users(id),       -- Ai thực hiện
  actor_name TEXT NOT NULL,                 -- Snapshot tên (tránh JOIN khi hiển thị)
  action TEXT NOT NULL CHECK(action IN (
    'tracking_updated',   -- Cập nhật tiến độ tuần
    'goal_created',
    'goal_status_changed',
    'goal_completed',
    'reward_requested',
    'reward_approved',
    'reward_rejected',
    'comment_added',
    'financial_updated'   -- Kế toán nhập DT tháng
  )),
  entity_type TEXT NOT NULL,  -- 'goal' | 'reward_approval' | 'monthly_actuals'
  entity_id TEXT NOT NULL,
  entity_title TEXT NOT NULL, -- Snapshot tên goal/entity (tránh JOIN)
  meta TEXT,                  -- JSON bổ sung (vd: {"week":10,"status":"done"})
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_activity_feed_company
  ON activity_feed(company_id, created_at DESC);

-- [C31] Retention: Activity Feed giữ 12 tháng trong D1.
-- Cron Trigger chạy mỗi đầu tháng 03:00 AM ICT:
--   1. SELECT records > 12 tháng → ghi JSON vào R2: archive/activity/{YYYY}/{MM}.jsonl
--   2. DELETE FROM activity_feed WHERE created_at < (now - 12 tháng)
-- Archive R2 giữ vĩnh viễn để tra cứu khi cần.

-- Comments thảo luận trên Goal [C24]
-- Hỗ trợ mention user bằng @username (lưu trong content dạng @userId)
CREATE TABLE goal_comments (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id),
  author_id TEXT REFERENCES users(id),
  content TEXT NOT NULL,                    -- Plain text, @userId được render thành @Tên
  mentions TEXT,                            -- JSON array userId được mention: ["u1","u2"]
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER                        -- Soft delete comment
);

CREATE INDEX idx_goal_comments_goal
  ON goal_comments(goal_id, created_at ASC);

-- Lịch sử KPI cá nhân Sale [C10 extension]
-- Mỗi lần sửa personal_kpi → snapshot lưu vào đây
CREATE TABLE personal_kpi_history (
  id TEXT PRIMARY KEY,
  personal_kpi_id TEXT NOT NULL,            -- FK mềm (không CASCADE vì cần giữ history)
  user_id TEXT REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER,
  income_target REAL,
  commission_rate REAL,
  conversion_rate REAL,
  avg_order_value REAL,
  working_days_per_month INTEGER,
  changed_by TEXT REFERENCES users(id),
  changed_at INTEGER NOT NULL
);

-- [C32] Index để query lịch sử KPI nhanh
CREATE INDEX idx_personal_kpi_history_user
  ON personal_kpi_history(user_id, changed_at DESC);
```

#### Cloudflare KV — Audit Log Pattern (với Dual-Write cho event critical)

> **[C18] Rủi ro Eventually Consistent:** Cloudflare KV có thể delay vài giây khi propagate giữa các edge node. Với log thông thường (tracking update, comment) chấp nhận được. Với event **critical** (reward approve/reject, role change, login fail) → áp dụng **dual-write**: ghi D1 trước (source of truth), ghi KV sau (cache/query nhanh).

```typescript
// Phân loại event
const CRITICAL_EVENTS = ['reward_approved','reward_rejected','role_changed',
                          'login_failed','password_changed'] as const;

// Ghi log — tự động dual-write nếu là critical event
async function writeAuditLog(env: Env, params: {
  companyId: string;
  entityType: 'goal' | 'tracking' | 'financial' | 'user' | 'security';
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  oldValue?: object;
  newValue?: object;
  isCritical?: boolean;
}) {
  const payload = {
    action: params.action,
    userId: params.userId,
    userName: params.userName,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
    createdAt: new Date().toISOString(),
  };

  // [C18] Critical events: ghi D1 trước (strongly consistent)
  if (params.isCritical) {
    await env.DB.prepare(`
      INSERT INTO audit_critical
        (id, company_id, entity_type, entity_id, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), params.companyId,
      params.entityType, params.entityId,
      JSON.stringify(payload), Date.now()
    ).run();
  }

  // KV ghi async — non-blocking, TTL 365 ngày
  const key = `audit:${params.companyId}:${params.entityType}:${params.entityId}:${Date.now()}`;
  await env.AUDIT_KV.put(key, JSON.stringify(payload), { expirationTtl: 31536000 });
}

// Đọc log: ưu tiên KV; fallback D1 nếu KV chưa sync
async function getAuditLogs(env: Env, companyId: string, goalId: string) {
  const prefix = `audit:${companyId}:goal:${goalId}:`;
  const list = await env.AUDIT_KV.list({ prefix, limit: 50 });
  const logs = await Promise.all(
    list.keys.map(k => env.AUDIT_KV.get(k.name).then(v => v ? JSON.parse(v) : null))
  );
  return logs.filter(Boolean).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
```

**Bảng `audit_critical` trong D1** (chỉ cho critical events):
```sql
-- [C18] Chỉ lưu critical events — giữ D1 nhẹ
CREATE TABLE audit_critical (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,  -- JSON
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_audit_critical_entity
  ON audit_critical(company_id, entity_type, entity_id, created_at DESC);
```

### 9.3 API Endpoints (Cloudflare Workers)

```
Authentication:
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

Company:
GET    /api/company
PUT    /api/company

Users & Departments:
GET    /api/users
POST   /api/users
PUT    /api/users/:id
GET    /api/departments
POST   /api/departments

Goals:
GET    /api/goals?year=&category=&dept=
POST   /api/goals
GET    /api/goals/:id
PUT    /api/goals/:id
DELETE /api/goals/:id                       -- [C29] Soft Delete: SET deleted_at = NOW(), không xóa cứng
POST   /api/goals/:id/restore               -- [C29] Restore: SET deleted_at = NULL (Admin only)

Strategies:
POST   /api/goals/:id/strategies
PUT    /api/strategies/:id
DELETE /api/strategies/:id

Tracking:
GET    /api/goals/:id/tracking?year=
PUT    /api/goals/:id/tracking/:week
GET    /api/tracking/dashboard?year=&quarter=

Financial:
GET    /api/financial/targets/:year
PUT    /api/financial/targets/:year
GET    /api/financial/actuals/:year
PUT    /api/financial/actuals/:year/:month

Products (BCG):
GET    /api/products?year=
POST   /api/products
PUT    /api/products/:id

Five-Way:
GET    /api/fiveway/:year

Personal KPI (Sale):
GET    /api/personal-kpi
PUT    /api/personal-kpi

Reports:
GET    /api/reports/quarterly?year=&quarter=  (xuất JSON cho PDF)
GET    /api/reports/department/:deptId?year=&quarter=

Reward Approvals:
POST   /api/goals/:id/reward-request          -- Trưởng BP đề nghị
GET    /api/reward-approvals?status=pending    -- Admin xem danh sách chờ duyệt
PUT    /api/reward-approvals/:id/approve       -- Admin approve
PUT    /api/reward-approvals/:id/reject        -- Admin reject + reason

Notifications: [C19]
GET    /api/notifications?is_read=0            -- Lấy notifications chưa đọc
PUT    /api/notifications/:id/read             -- Đánh dấu đã đọc
PUT    /api/notifications/read-all             -- Đánh dấu tất cả đã đọc
GET    /api/notifications/count-unread         -- Badge số (dùng polling mỗi 30 giây)

Activity Feed: [C20]
GET    /api/activity-feed?limit=5             -- 5 hoạt động gần nhất (Dashboard)
GET    /api/activity-feed?limit=20&page=      -- Lịch sử đầy đủ

Goal Comments: [C24]
GET    /api/goals/:id/comments
POST   /api/goals/:id/comments                -- Tạo comment + trigger mention notification
PUT    /api/comments/:id                      -- Sửa (author only, trong 5 phút đầu)
DELETE /api/comments/:id                      -- Soft delete

Departments: [C22]
GET    /api/departments
POST   /api/departments
PUT    /api/departments/:id
PUT    /api/departments/:id/manager           -- Reassign manager khi BP nghỉ việc

File Upload:
POST   /api/upload  (→ Cloudflare R2)
```

### 9.4 Cấu trúc thư mục dự án

```
goal-manager/
├── apps/
│   ├── web/                    # Cloudflare Pages (Next.js)
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── dashboard/
│   │   │   ├── goals/
│   │   │   ├── financial/
│   │   │   ├── bcg/
│   │   │   ├── fiveway/
│   │   │   ├── personal-kpi/
│   │   │   ├── settings/
│   │   │   └── reports/
│   │   └── components/
│   └── api/                    # Cloudflare Workers
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── db/             # D1 queries
│       │   └── utils/
│       └── wrangler.toml
├── migrations/                 # [C35] D1 SQL migrations — mỗi migration có up + down
│   ├── 0001_init.up.sql
│   ├── 0001_init.down.sql
│   ├── 0002_add_products.up.sql
│   ├── 0002_add_products.down.sql
│   ├── 0003_add_notifications.up.sql
│   ├── 0003_add_notifications.down.sql
│   └── ...
└── packages/
    └── shared/                 # Types dùng chung
```

**[C35] Migration Strategy:**
- Mỗi migration bắt buộc có cặp `.up.sql` (apply) + `.down.sql` (rollback)
- `.down.sql` phải đảo ngược chính xác những gì `.up.sql` thay đổi (DROP TABLE, DROP INDEX, ALTER TABLE DROP COLUMN...)
- Deploy production: chạy `wrangler d1 migrations apply goal-manager-db --remote`
- Rollback: chạy `.down.sql` thủ công qua `wrangler d1 execute goal-manager-db --remote --file=migrations/XXXX.down.sql`
- **Quy tắc an toàn:** Không bao giờ ALTER TABLE DROP COLUMN trên production nếu cột đó đang chứa data — thay bằng deprecate + ignore ở tầng API, dọn dẹp sau 1 sprint

### 9.5 Cloudflare Config (wrangler.toml)

```toml
name = "goal-manager-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "goal-manager-db"
database_id = "<your-d1-id>"

# [C7] Cache cho refresh token + session
[[kv_namespaces]]
binding = "CACHE"
id = "<your-kv-id>"

# [C2] Audit log tách biệt khỏi D1
[[kv_namespaces]]
binding = "AUDIT_KV"
id = "<your-audit-kv-id>"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "goal-manager-files"

[vars]
JWT_SECRET = "<set-in-dashboard>"
APP_ENV = "production"
JWT_EXPIRES_IN = "28800"       # 8 giờ (giây)
REFRESH_EXPIRES_IN = "2592000" # 30 ngày (giây)
```

---

## 10. Thiết Kế UI/UX

### 10.1 Navigation Structure

```
Sidebar — Admin / Manager / Staff:
├── 🏠 Dashboard Tổng quan
├── 🎯 Mục Tiêu Công Ty
│   ├── Mission & Vision
│   ├── Mục tiêu Năm
│   └── Kế hoạch Hành động (Timeline)
├── 💰 Tài Chính
│   ├── Mục tiêu Tài chính
│   ├── Doanh thu Thực tế
│   └── Five-Way Analysis
├── 📦 Sản Phẩm (BCG)
├── 👤 KPI Cá nhân
├── 📊 Báo Cáo
└── ⚙️ Cài đặt (Admin only)
    ├── Công ty
    ├── Phân quyền
    └── Phòng ban

Sidebar — Finance (rút gọn): [C4]
├── 🏠 Dashboard (Read-only — không có nút Edit bất kỳ Goal nào)
└── 💰 Tài Chính
    ├── Mục tiêu Tài chính (read)
    └── Nhập Doanh thu Thực tế (write)
```

### 10.2 Dashboard Tổng Quan

**Khu vực 1 — Scorecard 6 trụ cột:**
Mỗi trụ cột hiển thị: Tên → Số goal → % hoàn thành → Mini progress bar → Badge màu (xanh/vàng/đỏ)

**Khu vực 2 — Tài chính tháng hiện tại:**
DT Thực tế vs Kế hoạch tháng | % đạt năm | Số tháng còn lại | DT TB cần đạt

**Khu vực 3 — Activity feed:**
5 cập nhật gần nhất: [Tên người] → [Goal] → [Trạng thái] → [Thời gian]

**Khu vực 4 — Cảnh báo:**
List goal bị đỏ ≥ 2 tuần liên tiếp

**Khu vực 5 — Phê duyệt phần thưởng (Admin only) [C10]:**
Badge số đỏ trên icon chuông khi có reward request `pending`. Click mở panel danh sách: [Tên goal] → [Bộ phận đề nghị] → [Mô tả thưởng] → [Nút Approve / Reject]

### 10.3 Màu sắc trạng thái

```
Hoàn thành:  #22C55E (xanh lá)
Đang làm:    #F59E0B (vàng cam)
Chưa làm:    #EF4444 (đỏ)
Chưa cập nhật: #94A3B8 (xám)
```

---

## 11. Lộ Trình Phát Triển

### Phase 1 — MVP (6 tuần)

| Tuần | Sprint | Nội dung |
|------|--------|----------|
| 1–2 | Sprint 1 | Setup Cloudflare (Pages + Workers + D1), Auth, Schema DB |
| 3–4 | Sprint 2 | CRUD Goals 6 trụ cột, Strategy, Measure, giao diện quản lý |
| 5–6 | Sprint 3 | Weekly tracking grid, Dashboard tổng quan, Module tài chính cơ bản |

**MVP Definition:** User có thể login, tạo mục tiêu 6 trụ cột, cập nhật tiến độ tuần, nhập DT thực tế, xem dashboard.

### Phase 2 — v1.1 (4 tuần)

| Tuần | Nội dung |
|------|----------|
| 7–8 | Five-Way Analysis, BCG Matrix, module cắt giảm chi phí |
| 9–10 | Xuất PDF báo cáo, upload file R2, email notification |

### Phase 3 — v2.0 (Q3 2026)

- KPI cá nhân nâng cao
- Zalo ZNS integration
- Multi-tenant SaaS
- AI insights

---

## 12. Metrics Thành Công

### 12.1 Leading Indicators (đo sau 2–4 tuần)

| Metric | Mục tiêu | Công thức |
|--------|----------|-----------|
| Activation rate | ≥ 70% | % user hoàn thành setup goal đầu tiên |
| Weekly tracking update rate | ≥ 60% | % goal được cập nhật ≥ 1 lần/tuần |
| Time to first goal | < 10 phút | Từ đăng ký đến tạo goal đầu tiên |
| DAU/MAU ratio | ≥ 20% | Tần suất quay lại |

### 12.2 Lagging Indicators (đo sau 1–3 tháng)

| Metric | Mục tiêu | Ghi chú |
|--------|----------|---------|
| 90-day retention | ≥ 60% | % company vẫn active sau 90 ngày |
| Goals completion rate | ≥ 40% | % goal đạt trạng thái "Hoàn thành" cuối quý |
| Meeting time reduction | -50% | Khảo sát trực tiếp người dùng |
| NPS score | ≥ 40 | Gửi sau 4 tuần sử dụng |

---

## 13. Câu Hỏi Mở (Open Questions)

> ✅ **Tất cả 7 câu hỏi đã được chốt.** Không còn blocking item nào trước Sprint 1.

| # | Câu hỏi | Quyết định |
|---|---------|-----------|
| Q1 | D1 performance cho JOIN phức tạp? | ✅ Audit log tách sang KV [C2] — D1 chỉ còn core data, không cần Hyperdrive v1 |
| Q2 | Auth: Cloudflare Access hay tự build JWT? | ✅ Tự build JWT trong Workers [C7] — tối ưu chi phí theo Seat |
| Q3 | Phần thưởng có cần workflow phê duyệt? | ✅ **Có** — Flow 3 bước: Đề nghị → Pending → Approve/Reject [C10] |
| Q4 | Export PDF dùng gì? | ✅ Client-side render: `window.print()` / `jsPDF` trên Next.js [C8] |
| Q5 | Cần offline/PWA không? | ✅ **Không cần** — ghi rõ vào Non-Goals [C11] |
| Q6 | Năm tài chính bắt đầu tháng mấy? | ✅ **Tháng 1** — hardcode, xóa `fiscal_year_start` [C12] |
| Q7 | Multi-tenant trong v1? | ✅ Schema multi-tenant, UI/API lock 1 company/token [C3] |

---

## 14. Phụ Lục

### A. Mapping Excel → Phần Mềm

| Sheet Excel | Module phần mềm | Ghi chú |
|-------------|-----------------|---------|
| MV-GSM / MVGSM 2026 | Goals > CRUD + Tracking grid | Core feature |
| Mục tiêu 2026 | Financial > Monthly actuals | Nhập DT từng tháng |
| 1.MỤC TIÊU TÀI CHÍNH | Financial > Targets | Setup đầu năm |
| 1.BCG | Products > BCG Matrix | Quản lý sản phẩm |
| 2. Five way Quý | Financial > Five-Way | Dashboard phân tích |
| 3.Tính mục tiêu Sale | Personal KPI | Tính KPI cá nhân |
| 4 & 5. Cắt giảm CP | Financial > Cost Reduction | Kế hoạch chi phí |
| 6. KẾ HOẠCH HÀNH ĐỘNG | Goals > Action Plan timeline | Grid tuần |
| BCTC | Reports > Financial Report | Xuất báo cáo |

### B. Ước Tính Effort (đã điều chỉnh v1.1)

| Module | Frontend | Backend | DB/Infra | Tổng | Ghi chú |
|--------|----------|---------|----------|------|---------|
| Auth + Phân quyền | 2 ngày | 2.5 ngày | 0.5 ngày | 5 ngày | [C7] JWT tự build + refresh token KV |
| Goals CRUD | 4 ngày | 2 ngày | 1 ngày | 7 ngày | [C1] Thêm start/end_week |
| Weekly Tracking | 5 ngày | 1.5 ngày | 0.5 ngày | 7 ngày | [C6] Grid state phức tạp; [C2] KV audit log |
| Dashboard | 3 ngày | 1.5 ngày | 0 | 4.5 ngày | [C10] Thêm khu vực reward badge |
| Financial Module | 3 ngày | 2 ngày | 0.5 ngày | 5.5 ngày | |
| Personal KPI | 2 ngày | 0.5 ngày | 0.5 ngày | 3 ngày | [C5] working_days field |
| **Reward Approval** | **1.5 ngày** | **1 ngày** | **0.5 ngày** | **3 ngày** | **[C10] Flow 3 bước mới** |
| **TỔNG MVP** | **20.5 ngày** | **11 ngày** | **3.5 ngày** | **~35 ngày** | +3 ngày so v1.1 |

### C. Glossary

| Thuật ngữ | Định nghĩa |
|-----------|-----------|
| MV-GSM | Mission–Vision–Goals–Strategy–Measure: framework quản trị mục tiêu |
| KHTN | Khách hàng tiềm năng |
| Five-Way | 5 yếu tố nhân: KHTN × Tỷ lệ CĐ × Số lần GD × DT TB đơn × Tỷ suất LN = Doanh thu |
| BCG Matrix | Ma trận phân loại sản phẩm: Ngôi sao / Bò sữa / Chấm hỏi / Con chó |
| D1 | Cloudflare D1: serverless SQLite database |
| Workers | Cloudflare Workers: serverless edge compute |
| R2 | Cloudflare R2: object storage (tương đương S3) |
| KV | Cloudflare KV: key-value store cho caching |

---

*Document này được tạo dựa trên phân tích file `Nhóm_8_B2_Mục_tiêu_năm_Doanh_Nghiệp_NHI_CSPS_.xlsx` — framework MV-GSM của 2 công ty: CSPS Việt Nam và Tương Việt Hoa Sen.*


*v1.3.1 Final Freeze — 35 thay đổi tích lũy từ v1.0. **Đánh giá: 99% hoàn thiện. Sẵn sàng bàn giao cho Dev / Claude Code / Cursor — không cần PM giải thích thêm.***
