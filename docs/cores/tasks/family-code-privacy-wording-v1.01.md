# Family-code privacy wording — approved short copy

Owner approved the shortened EN/VI copy in the Release chat on 24 October 2026 AEDT: “good, noted this and keep working on what you were working on”. This approves the wording for Part 2 of [the plan](save-copy-family-code.md). Implementation remains pending; no production deployment is approved. Keep it distinct from the separate family-photo/device permissions.

## Approved wording

English: Link your family’s devices for statistics only—no progress or photo sharing. Keep your code private.

Tiếng Việt: Liên kết thiết bị để thống kê gia đình—không chia sẻ tiến trình hay ảnh. Giữ riêng mã gia đình.

The longer explanation below is retained as implementation context, not the approved on-screen text.

## English — Connect your family's devices

Create a family code, or enter one from another family device. No account or email is needed.

The code stays on your device and is included in “Save a copy”. For family statistics, the game sends a hashed version of the code—not the code itself—to recognise connected devices as one family. This feature does not add children's names or photos to those statistics.

**This does not sync game progress or give access to family photos.** Share the code only with trusted family members, and keep save copies private.

You can choose “Leave the family” on this device without deleting your children's progress.

## Tiếng Việt — Kết nối các thiết bị trong gia đình

Tạo mã gia đình hoặc nhập mã từ một thiết bị khác của gia đình. Không cần tài khoản hay email.

Mã được giữ trên thiết bị và có trong tệp “Lưu một bản”. Để thống kê theo gia đình, trò chơi gửi bản băm của mã—không gửi mã gốc—nhằm nhận biết các thiết bị thuộc cùng một gia đình. Tính năng này không bổ sung tên hay ảnh của trẻ vào thống kê đó.

**Mã này không đồng bộ tiến trình chơi và không cấp quyền xem ảnh gia đình.** Chỉ chia sẻ mã với người thân đáng tin cậy và giữ riêng các tệp sao lưu.

Bạn có thể chọn “Rời gia đình” trên thiết bị này mà không xóa tiến trình của các con.

## Proposed controls

- Create family code / Tạo mã gia đình
- Join with a code / Nhập mã gia đình
- Not now / Để sau
- Leave the family / Rời gia đình

Implementation review must verify these promises: local/raw-code handling, save-copy handling, hash-only family grouping, separate photo permissions and preservation of progress when leaving. QR camera permission wording must be reviewed with the actual scanning implementation before it ships. Do not claim that leaving erases previous analytics records.
