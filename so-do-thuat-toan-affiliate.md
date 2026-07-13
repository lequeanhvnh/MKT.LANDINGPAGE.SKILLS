# Sơ đồ thuật toán: Hệ thống Affiliate (tiếp thị liên kết)

> Tài liệu này giải thích **cách hệ thống affiliate gán đơn cho đối tác và tính hoa hồng** — từ lúc khách bấm link `?aff=CODE` cho tới lúc admin chi trả tiền cho đối tác. Viết cho người mới, từ dễ đến khó. Logic lấy từ skill `/biz-affiliate-system`.

---

## 1. Hiểu nhanh trong 30 giây

Affiliate = cho người khác (đối tác / cộng tác viên) đi giới thiệu khách, ai giới thiệu ra đơn thì được chia % hoa hồng.

Hệ thống chỉ cần làm đúng **4 việc**:

1. **Gán đơn đáng tin** — khách bấm link `?aff=LINH7K2` → ghi cookie 30 ngày → đơn nào về sau cũng "dán nhãn" đối tác đó.
2. **Hoa hồng là bản ghi tài chính** — mỗi đơn đã thanh toán sinh **1 dòng hoa hồng bất biến**, chụp ảnh (snapshot) số tiền + % tại thời điểm bán, không bao giờ hết hạn.
3. **Idempotent** — ngân hàng/Sepay gọi webhook lại nhiều lần cũng **không** tạo hoa hồng trùng.
4. **Đối tác tự phục vụ** — có portal riêng để đối tác tự xem click / đơn / hoa hồng, đỡ phải hỏi admin.

> 💡 **Quy tắc vàng:** "Cookie quyết định ai được tính công; database quyết định trả bao nhiêu."

---

## 2. Sơ đồ tổng quan — 5 nhân vật

```mermaid
flowchart LR
    subgraph DT["🤝 ĐỐI TÁC"]
        P1["Có mã + link<br/>site.com/?aff=CODE"]
    end

    subgraph KH["🧑 KHÁCH HÀNG (trình duyệt)"]
        A1["Bấm link aff"]
        A2["Điền form + chuyển khoản"]
    end

    subgraph SV["⚙️ SERVER (Next.js API)"]
        B1["AffiliateTracker<br/>ghi cookie + đếm click"]
        B2["/api/checkout<br/>đọc cookie → lưu aff_code"]
        B3["/api/sepay-webhook<br/>đơn paid → tính hoa hồng"]
    end

    subgraph DB["🗄️ SUPABASE"]
        C1[("affiliates<br/>đối tác")]
        C2[("affiliate_clicks<br/>log click")]
        C3[("affiliate_commissions<br/>sổ hoa hồng")]
        C4[("leads.aff_code<br/>đơn gắn đối tác")]
    end

    subgraph AD["👤 ADMIN + PORTAL"]
        D1["/admin/affiliates<br/>duyệt → chi trả"]
        D2["/affiliate<br/>đối tác tự xem"]
    end

    P1 --> A1 --> B1 --> C2
    A2 --> B2 --> C4
    B2 -.đọc cookie.-> C1
    B3 --> C3
    C1 --> D1
    C3 --> D1
    C3 --> D2
    C1 --> D2
```

---

## 3. Luồng 1 — Khách bấm link aff (gán nhãn last-touch)

`AffiliateTracker` (client component gắn trong `layout.tsx`) chạy trên **mọi trang**. Mỗi lần thấy `?aff=` trên URL → ghi đè cookie. Đối tác giới thiệu **gần nhất** được tính công (last-touch).

```mermaid
flowchart TD
    S["Khách mở trang<br/>site.com/?aff=LINH7K2"] --> Q{"URL có<br/>?aff= hoặc ?ref= ?"}
    Q -->|Không| END1["Không làm gì"]
    Q -->|Có| W["Ghi đè cookie<br/>aff_ref=LINH7K2<br/>(hạn 30 ngày)"]
    W --> BEACON["Bắn beacon<br/>POST /api/affiliate/click"]
    BEACON --> REC["Ghi 1 row affiliate_clicks<br/>(aff_code, path, referrer)"]
    REC --> OK["Luôn trả 200<br/>(fire-and-forget, lỗi cũng kệ)"]
```

> ⚠️ **Click không cần mã đúng**: bảng `affiliate_clicks` **không** có khoá ngoại tới `affiliates`. Khách gõ link sai mã vẫn ghi log; lúc portal hiển thị thì query lọc đúng `aff_code` của đối tác thật nên rác tự ẩn.

---

## 4. Luồng 2 — Khách điền form & chuyển khoản (gắn đơn)

Mấu chốt: **không sửa form đăng ký**. Có nhiều form rải rác khắp các trang — patch hết thì mong manh. Thay vào đó **server đọc cookie `aff_ref`** lúc tạo đơn, nên mọi form tự động kèm aff.

```mermaid
flowchart TD
    F["Khách điền form<br/>tên / SĐT / email"] --> POST["POST /api/checkout"]
    POST --> READ["readAffCookie()<br/>đọc cookie aff_ref<br/>từ header request (server-side)"]
    READ --> CREATE["createLead({ ...data, affCode })"]
    CREATE --> LEAD[("leads<br/>row mới, cột aff_code=LINH7K2")]
    LEAD --> QR["Trả VietQR cho khách quét"]
    QR --> PAY["Khách chuyển khoản"]
    PAY -.Sepay báo về.-> WH["/api/sepay-webhook"]
```

---

## 5. Luồng 3 — Đơn paid → sinh hoa hồng (trái tim hệ thống)

Sau khi `markLeadPaid()` thành công, webhook gọi `recordCommissionForOrder(orderId)`. Hàm này được bọc `try/catch` — **hoa hồng lỗi KHÔNG được làm fail việc xác nhận thanh toán** (nếu không Sepay sẽ retry → phiền).

```mermaid
flowchart TD
    WH["sepay-webhook:<br/>markLeadPaid() OK"] --> CALL["recordCommissionForOrder(orderId)"]
    CALL --> G1{"Lead có<br/>aff_code không?"}
    G1 -->|Không| SKIP1["Bỏ qua êm<br/>(đơn không qua aff)"]
    G1 -->|Có| G2{"Tra affiliates<br/>theo aff_code<br/>— tồn tại?"}
    G2 -->|Không| SKIP2["Bỏ qua êm<br/>(mã rác)"]
    G2 -->|Có| G3{"Đối tác status<br/>= active ?"}
    G3 -->|paused| SKIP3["Bỏ qua êm<br/>(đối tác tạm khoá)"]
    G3 -->|active| CALC["Tính tiền:<br/>commission_amount =<br/>round(order_amount × rate / 100)"]
    CALC --> SNAP["SNAPSHOT vào row:<br/>rate, amount, customer_name,<br/>ticket, order_amount"]
    SNAP --> INS["INSERT affiliate_commissions<br/>status = pending"]
    INS --> DUP{"Lỗi 23505?<br/>(order_id UNIQUE)"}
    DUP -->|Có| IDEMP["Webhook retry → đã có hoa hồng<br/>→ im lặng bỏ qua (idempotent)"]
    DUP -->|Không| DONE["✅ Tạo hoa hồng pending"]
```

**Hai bảo hiểm quan trọng đứng cạnh nhau ở đây:**

| Cơ chế | Vì sao | Cách làm |
|---|---|---|
| **Idempotent** | Sepay retry webhook song song | `order_id` UNIQUE + bắt lỗi `23505` ở tầng DB (chắc hơn check-then-insert vì có race) |
| **Snapshot** | Sau này admin đổi % của đối tác, hoặc `leads` hết TTL 90 ngày bị xoá | Chụp cứng rate + số tiền + tên + sản phẩm vào row hoa hồng → đọc độc lập như sổ kế toán |

---

## 6. Vòng đời một bản ghi hoa hồng (state machine)

```mermaid
stateDiagram-v2
    [*] --> pending: đơn paid + lead có aff_code<br/>(đối tác active)
    pending --> approved: admin "Duyệt"
    approved --> paid: admin "Đánh dấu đã trả"<br/>(+ payout_note)
    pending --> rejected: admin "Từ chối"<br/>(đơn hoàn/huỷ)
    approved --> rejected: admin "Từ chối"
    rejected --> pending: admin "Mở lại"
    paid --> pending: admin "Mở lại" (hiếm)
    paid --> [*]: trạng thái cuối
```

- **pending** — tạo tự động khi đơn paid. Đối tác `paused` thì **không** tạo.
- **approved** — admin đã đối soát, hợp lệ, chờ kỳ chi trả.
- **paid** — đã chuyển tiền, có `payout_note` (vd "CK Vietcombank 01/06").
- **rejected** — KHÔNG tính vào tổng hoa hồng / doanh thu / số đơn.

> 💡 `leads` có pg_cron tự xoá sau 90 ngày, nhưng `affiliate_commissions` **không bao giờ TTL** — nó là sổ sách tài chính.

---

## 7. Luồng 4 — Admin quản trị & Portal đối tác

```mermaid
flowchart LR
    subgraph ADMIN["/admin/affiliates (x-admin-pass)"]
        AG["GET: list đối tác<br/>+ hoa hồng + thống kê"]
        AP["POST: tạo đối tác mới<br/>→ sinh aff_code"]
        APA["PATCH: sửa đối tác /<br/>đổi trạng thái hoa hồng"]
    end

    subgraph PORTAL["/affiliate (đối tác tự xem)"]
        L["Đăng nhập:<br/>mã aff + email"]
        V{"Cặp mã+email<br/>khớp affiliates?"}
        DASH["Dashboard: link, click,<br/>đơn giới thiệu, hoa hồng"]
    end

    AP --> CODE["genAffCode(name)<br/>chữ HOA+số, bỏ 0/O 1/I/L,<br/>~7 ký tự, trùng thì retry"]
    L --> V
    V -->|Không| DENY["Từ chối"]
    V -->|Có| DASH
```

**Portal đăng nhập đơn giản có chủ đích**: mã aff vốn công khai trên link, nên **email** đóng vai "lớp khoá" cơ bản — đủ cho quy mô landing page, không cần mật khẩu riêng.

---

## 8. Bảo mật & quy ước cần nhớ

```mermaid
flowchart TD
    R["3 bảng affiliate<br/>bật RLS, KHÔNG policy"] --> DENY["anon / authenticated<br/>bị chặn HẾT"]
    DENY --> ONLY["Chỉ backend service_role<br/>(bypass RLS) đọc/ghi"]
    ONLY --> EXPOSE["Ra client chỉ qua<br/>API đã verify"]
    EXPOSE --> PUB["aff_code lộ trên URL = chủ đích<br/>(link công khai)"]
    EXPOSE --> SECRET["email + số liệu hoa hồng<br/>KHÔNG bao giờ ra client tự do"]
```

- **Last-touch**: mỗi `?aff=` mới ghi đè cookie → đối tác giới thiệu sau cùng được công.
- **aff_code an URL**: chữ HOA + số, bỏ ký tự dễ nhầm (`0/O`, `1/I/L`), độ dài ~7.
- **Hoa hồng = sổ kế toán**: không TTL, snapshot bất biến, `order_id` UNIQUE.
- **Tiền VND**: format có chấm phân cách nghìn, vd `1.286.800đ`.

---

## 9. Tóm tắt 1 dòng cho mỗi mảnh

| Mảnh | Việc duy nhất nó làm |
|---|---|
| `AffiliateTracker` (layout) | Thấy `?aff=` → ghi cookie 30 ngày + bắn beacon đếm click |
| `/api/affiliate/click` | Nhận beacon, ghi `affiliate_clicks`, luôn trả 200 |
| `/api/checkout` (patch) | Đọc cookie `aff_ref` server-side → lưu `leads.aff_code` |
| `/api/sepay-webhook` (patch) | Đơn paid → `recordCommissionForOrder()` (try/catch) |
| `recordCommissionForOrder()` | Tra đối tác → tính tiền → snapshot → insert pending (idempotent) |
| `/admin/affiliates` | Tạo/sửa đối tác + duyệt → chi trả hoa hồng |
| `/affiliate` | Đối tác đăng nhập (mã+email) → tự xem số liệu |
