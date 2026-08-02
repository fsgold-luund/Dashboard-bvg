# Hướng dẫn triển khai

## 1. Chuẩn bị

- Cài `clasp`: `npm install -g @google/clasp`
- Đăng nhập: `clasp login`
- Bật Apps Script API cho tài khoản Google: https://script.google.com/home/usersettings (bật "Google Apps Script API")

## 2. Tạo Google Sheet làm database

1. Tạo một Google Spreadsheet mới, đặt tên tuỳ ý (vd. "Enterprise DB").
2. Copy `Spreadsheet ID` từ URL (`.../d/<ID_ở_đây>/edit`).
3. Tạo một thư mục Google Drive để lưu file đính kèm Task, copy `Folder ID` từ URL.

## 3. Tạo project Apps Script và liên kết clasp

Từ thư mục gốc của project (nơi có `appsscript.json`):

```bash
clasp create --type webapp --title "Enterprise Dashboard Framework" --rootDir .
```

Lệnh trên tạo file `.clasp.json` với `rootDir: "."` — **bắt buộc** giữ nguyên `rootDir: "."` vì cả `/app` và `/config` đều cần được đẩy lên cùng một project. Với cấu trúc này, tên file trên trình soạn thảo Apps Script sẽ hiển thị dạng cây thư mục đúng như local (vd. `app/controllers/TaskController`, `config/Config`) — đây là hành vi clasp hỗ trợ sẵn cho nested folders.

Đẩy code lên:

```bash
clasp push
```

## 4. Cấu hình Script Properties (bắt buộc trước khi chạy)

Mở project trên `script.google.com` → biểu tượng bánh răng (Project Settings) → "Script Properties" → thêm:

| Key | Bắt buộc | Ghi chú |
|---|---|---|
| `SPREADSHEET_ID` | Có | ID Sheet ở bước 2 |
| `APP_SECRET` | Có | Chuỗi bí mật tự đặt (dùng ký HMAC action-token) — vd. sinh bằng `openssl rand -hex 32` |
| `WEBHOOK_SECRET` | Có | Chuỗi bí mật riêng cho endpoint `doPost` (Data-In từ hệ thống ngoài) — sinh độc lập với `APP_SECRET`, vd. `openssl rand -hex 32`. Xem mục 10. |
| `ATTACHMENT_FOLDER_ID` | Có | Folder ID ở bước 2 |
| `INITIAL_COMPANY_NAME` | Không | Tên công ty khi seed lần đầu (mặc định "Công ty của bạn") |
| `INITIAL_ADMIN_EMAIL` | Không* | Email Super Admin đầu tiên |
| `INITIAL_ADMIN_PASSWORD` | Không* | Mật khẩu Super Admin đầu tiên — **xoá property này sau khi chạy seed xong** |

\* Nếu bỏ trống, `Setup.gs` sẽ bỏ qua bước tạo Super Admin — bạn sẽ cần tự thêm bằng cách chạy `UserModel.createUser(...)` thủ công trong trình soạn thảo.

## 5. Khởi tạo dữ liệu ban đầu

Trong trình soạn thảo Apps Script: chọn file `Setup.gs`, chọn hàm `setupInitialData` ở dropdown, bấm **Run**. Lần chạy đầu sẽ cấp quyền OAuth (Sheets, Drive, Gmail) — chấp nhận.

Hàm này tạo sẵn: 17 sheet + header, 7 Role, toàn bộ Permission, ma trận RolePermission mặc định, 1 Company, 1 phòng ban "Ban Giám Đốc", và tài khoản Super Admin (nếu đã set 2 property ở trên). An toàn khi chạy lại nhiều lần (tự bỏ qua phần đã có dữ liệu).

Sau khi xác nhận đăng nhập được bằng tài khoản Super Admin, vào Script Properties **xoá `INITIAL_ADMIN_PASSWORD`** để không lưu mật khẩu dạng plain-text lâu dài.

## 6. Deploy Web App

Trong trình soạn thảo: **Deploy → New deployment** → chọn loại **Web app**:
- Execute as: **Me** (chạy bằng quyền của người deploy — cần thiết vì `SpreadsheetApp`/`MailApp` phải chạy dưới 1 tài khoản cố định, không phải tài khoản người dùng cuối)
- Who has access: **Anyone** (để nhân viên trong công ty truy cập được link; nếu dùng Google Workspace domain riêng có thể chọn "Anyone within [domain]" để giới hạn)

Copy URL dạng `https://script.google.com/macros/s/AKfycb.../exec` — đây là link nhân viên sẽ dùng để đăng nhập. Có thể lưu URL này vào Script Property `APP_URL` (không bắt buộc, chỉ để `Config.getAppUrl()` trả về đúng giá trị khi cần link tuyệt đối, vd. trong email).

Mỗi lần `clasp push` code mới, phải **Deploy → Manage deployments → Edit → New version** thì bản Web App đang chạy mới cập nhật code (push không tự động cập nhật deployment đang published).

## 7. Deploy Domain (tuỳ chọn)

Vì hệ thống đang chạy trên Gmail cá nhân (không phải Google Workspace — theo quyết định ở Giai đoạn 1), **không thể gắn domain riêng** cho URL Web App. Nếu sau này nâng cấp lên Google Workspace, có thể:
- Dùng URL rút gọn qua dịch vụ riêng (vd. domain công ty redirect 301 sang URL `.../exec`)
- Hoặc cân nhắc Workspace Add-on / domain-restricted deployment nếu cần trải nghiệm URL đẹp hơn

## 8. Backup & Restore

**Backup:**
- Google Sheet đã tự có Version History (File → Version history) — đủ cho rollback dữ liệu ở mức thời gian gần.
- Định kỳ (khuyến nghị hàng tuần): `File → Make a copy` toàn bộ Spreadsheet sang một file backup riêng, hoặc viết thêm 1 time-driven trigger gọi `DriveApp.getFileById(Config.getSpreadsheetId()).makeCopy(...)` lưu vào thư mục backup — đây là phần có thể bổ sung ở giai đoạn mở rộng (Admin module).
- Code: vì đã quản lý bằng `clasp`/git, backup code = commit git bình thường.

**Restore:**
- Dữ liệu: mở bản backup Spreadsheet, `Make a copy`, cập nhật lại `SPREADSHEET_ID` trong Script Properties trỏ sang bản copy đó.
- Code: `clasp push` lại từ git về đúng project Apps Script (hoặc `clasp clone <scriptId>` sang project mới nếu cần tách môi trường).

## 9. Gợi ý môi trường Dev/Prod

Dùng 2 Google Sheet + 2 Apps Script project riêng (dev và prod), mỗi project có `.clasp.json`/Script Properties riêng. `clasp` hỗ trợ nhiều project bằng cách giữ nhiều thư mục `.clasp.json` khác nhau hoặc dùng `clasp switch`/dotfile riêng theo môi trường.

## 10. Webhook Data-In (doPost)

Ngoài Web App (`doGet`, dùng cho người dùng đăng nhập qua trình duyệt), project còn expose `doPost(e)` (xem `app/Main.gs` + `config/Webhook.gs`) để hệ thống ngoài (CRM, form, Zapier/Make, script khác...) ghi dữ liệu vào Sheet mà không cần đăng nhập.

- Xác thực bằng property `WEBHOOK_SECRET` (khác `APP_SECRET`) — gửi trong body, không phải header/query string, để tránh lộ qua log truy cập.
- Chỉ 3 action được phép: `task.create`, `task.updateStatus`, `employee.create` (danh sách `ALLOWED_ACTIONS` trong `config/Webhook.gs`) — mọi request cho action khác bị từ chối, kể cả khi secret đúng.
- Cùng URL `.../exec` như Web App, gọi bằng `POST` thay vì mở trình duyệt.

Ví dụ gọi từ bên ngoài:

```bash
curl -X POST "https://script.google.com/macros/s/AKfycb.../exec" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "<WEBHOOK_SECRET>",
    "action": "task.create",
    "data": {
      "title": "Công việc từ hệ thống ngoài",
      "assigneeId": "EMP-xxxxxxxx",
      "dueDate": "2026-08-15",
      "priority": "High"
    }
  }'
```

Response luôn là JSON `{ "success": true, "data": {...} }` hoặc `{ "success": false, "error": { "code", "message" } }` — không bao giờ trả HTML, kể cả khi lỗi.

Muốn mở thêm action cho webhook: thêm vào `ALLOWED_ACTIONS` trong `config/Webhook.gs`, cân nhắc kỹ vì action đó sẽ chạy dưới `SYSTEM_CONTEXT` (bỏ qua toàn bộ kiểm tra quyền theo Role/Permission của Middleware).

**Lưu ý cho Sheet đã tạo trước khi có cột `Gender`:** Employee sheet vừa được bổ sung cột `Gender` (phục vụ biểu đồ "Tỷ lệ giới tính theo phòng ban" trên Dashboard). Nếu Sheet Employee đã tồn tại từ trước, `Database.ensureSheetsExist()` sẽ không tự thêm cột cho sheet đã có — cần tự thêm cột `Gender` (giá trị `Male`/`Female`) vào đúng vị trí sau `FullName` trong Sheet, hoặc chấp nhận để trống (biểu đồ giới tính sẽ hiển thị 0% cho các phòng ban chưa có dữ liệu).
