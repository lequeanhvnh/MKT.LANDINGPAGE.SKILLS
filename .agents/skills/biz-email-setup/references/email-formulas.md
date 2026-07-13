# Email Formulas — 4 Pattern Auto-Responder tiếng Việt

Mỗi pattern dưới đây có **template subject + preview text + body block-by-block**. Skill thay biến `{{...}}` từ context Phase 1 (offer.json + form data). Đừng dùng template raw — luôn customize ít nhất subject + tên offer + signature theo brand của user.

---

## Pattern P1 — Lead Magnet Delivery

**Khi nào**: Offer là tải về free (PDF guide, ebook, swipe file, template, checklist, free training video).

### Subject variants (pick 1, A/B test 2)
- `{{name}}, {{magnet_name}} đã sẵn sàng — link tải bên trong 📩`
- `Tài liệu {{magnet_name}} của anh/chị {{name}} đây ạ ✓`
- `[Đã gửi] {{magnet_name}} — mở file ngay (mất 30 giây)`

### Preview text (50-90 ký tự)
> Em vừa gửi {{magnet_name}} cho anh/chị {{name}}. Link tải + 3 gợi ý dùng tốt nhất ở bên trong...

### Body structure

```
Chào anh/chị {{name}},

Em là {{sender_name}} từ {{brand_name}}. Em vừa nhận thông tin anh/chị
đăng ký nhận {{magnet_name}} — link tải đây ạ:

[Tải {{magnet_name}} ngay] → {{magnet_url}}

(Link còn hiệu lực 30 ngày, lưu lại để xem khi cần.)

---

3 gợi ý để anh/chị dùng tốt nhất:

1. {{tip_1_from_offer_mechanism}}
2. {{tip_2_from_offer_mechanism}}
3. {{tip_3_from_offer_mechanism}}

---

📍 Bước tiếp theo:

Sau khi anh/chị xem qua tài liệu, em sẽ gửi tiếp 1 email ngắn vào
{{next_email_day}} với {{next_email_content}}. Trong lúc đó, có gì cần
hỗ trợ anh/chị nhắn em qua Zalo: {{zalo_number}}.

Cảm ơn anh/chị đã tin tưởng {{brand_name}}.

— {{sender_name}}
{{brand_name}} | {{website_url}}
```

### Footer (compliance)
```
{{brand_address}}
Anh/chị nhận email này vì đã đăng ký tại {{landing_page_url}}.
Không muốn nhận nữa? [Hủy đăng ký] {{unsubscribe_url}}
```

---

## Pattern P2 — Booking Confirmation

**Khi nào**: Offer là đặt lịch call/consultation/demo/free strategy session. Form thường có thêm field "thời gian phù hợp" hoặc redirect sang Calendly.

### Subject variants
- `{{name}}, đã ghi nhận đăng ký buổi tư vấn — checklist chuẩn bị bên trong`
- `✓ Lịch tư vấn của anh/chị {{name}} — em xác nhận trong 2h nữa`
- `[Đã nhận] Đăng ký buổi {{session_name}} — 3 việc cần làm trước call`

### Preview text
> Em đã nhận thông tin, sẽ gọi xác nhận lịch trong {{response_window}}. Trong khi chờ, anh/chị xem nhanh checklist này...

### Body

```
Chào anh/chị {{name}},

Em là {{sender_name}} từ {{brand_name}}. Em vừa nhận đăng ký
buổi {{session_name}} của anh/chị.

✓ Đã ghi nhận — em sẽ gọi anh/chị qua số {{phone}} trong {{response_window}}
để xác nhận lịch cụ thể (em sẽ gọi từ số {{caller_number}}).

---

📋 Trước buổi nói chuyện, anh/chị chuẩn bị giúp em 3 việc nhỏ
(tổng 5 phút) để buổi tư vấn hiệu quả nhất:

1. {{prep_item_1}}
2. {{prep_item_2}}
3. {{prep_item_3}}

(Nếu chưa có cũng không sao, mình vẫn chat được — em hỏi để hiểu
context anh/chị nhanh hơn.)

---

🎯 Trong buổi {{session_duration}} mình sẽ đi qua:
- {{topic_1_from_offer}}
- {{topic_2_from_offer}}
- {{topic_3_from_offer}}

Không có pitch bán hàng, chỉ tư vấn thật. Nếu sau đó anh/chị muốn
{{next_step_name}} thì mình tính tiếp.

---

Cần đổi lịch hoặc có câu hỏi gấp, anh/chị nhắn Zalo: {{zalo_number}}.

Hẹn gặp anh/chị,

— {{sender_name}}
{{brand_name}}
```

---

## Pattern P3 — Pre-Payment Reminder (low-ticket VND)

**Khi nào**: Triggered từ form submit (`/api/submit`). User đã ấn "Đăng ký nhận thông tin" trên landing nhưng CHƯA thanh toán. Email kéo họ về checkout page.

**Quan trọng — KHÔNG list full deliverables/bonus stack ở đây**. Lead chưa "earn" được. Pre-payment email mà list hết bonus = giảm urgency thanh toán (lead tưởng đã có rồi, không cần pay). Để dành full deliverables cho Pattern P5 (post-payment onboarding). Đọc memory `feedback_email-autoresponder-2-stage-flow` để hiểu rationale.

### Subject variants
- `{{name}}, link thanh toán "{{product_name}}" — giữ giá {{price}} trong 24h ⏰`
- `🔓 Truy cập {{product_name}} chỉ {{price}} — link bên trong (hết hạn 24h)`
- `[Hold giá] {{product_name}} cho anh/chị {{name}} — 24h thanh toán`

### Preview text
> Em đã giữ giá {{price}} cho anh/chị {{name}} trong 24h tới. Link thanh toán ngay bên trong...

### Body (slim — pre-payment only)

```
Chào anh/chị {{name}},

Cảm ơn anh/chị đã quan tâm "{{product_name}}". Em đã giữ chỗ và
giữ giá ưu đãi {{price}} (giá thường {{regular_price}}) cho
anh/chị trong 24h tới.

---

💳 Link thanh toán:

[Thanh toán giữ chỗ {{price}}] → {{payment_url}}

Hỗ trợ: {{payment_methods}}.

---

🛡 Cam kết {{guarantee_days}} ngày hoàn tiền 100%

{{guarantee_text_from_offer_short}}

— Nghĩa là anh/chị mở khoá, xem thử, không hợp thì nhắn em
hoàn 100%, không cần lý do.

---

⏰ Lưu ý: Sau {{deadline_hours}}h, giá quay về {{regular_price}}
(em không có quyền giữ ngoại lệ).

Có gì khó khăn về thanh toán, anh/chị nhắn em Zalo: {{zalo_number}}.

— {{sender_name}}
{{brand_name}} | {{website_url}}
```

**KHÔNG thêm vào pre-payment email**:
- ❌ Full deliverables list ("anh/chị sẽ nhận X, Y, Z...") — để dành P5
- ❌ Full bonus stack với giá trị VND — để dành P5
- ❌ Group Telegram link — chỉ deliver sau khi pay
- ❌ Access credentials — chỉ deliver sau khi pay

**OK trong pre-payment email**:
- ✓ 1-line value tease nếu cần (vd: "lộ trình 8 tuần build AI Agent")
- ✓ Guarantee — giảm anxiety, không "spoil" content
- ✓ Urgency — push checkout
- ✓ Zalo support — giúp lead pay khi gặp issue

---

## Pattern P4 — Nurture (Sale call upcoming, high-ticket)

**Khi nào**: Offer high-ticket 5M-50M+ VND (1-1 coaching, agency service, executive program). Sales team sẽ call trong 24h để qualify + close. Email auto-responder set expectation và pre-qualify lead.

### Subject variants
- `{{name}}, em sẽ gọi trong 24h — 3 việc anh/chị xem trước giúp em`
- `✓ Đã nhận đăng ký {{program_name}} — checklist pre-call`
- `[Hot] Lịch call của anh/chị {{name}} — chuẩn bị 5 phút bên trong`

### Preview text
> Em sẽ liên hệ anh/chị qua {{phone}} trong 24h tới. Trước call, anh/chị xem nhanh 3 thứ này...

### Body

```
Chào anh/chị {{name}},

Em là {{sender_name}} — em phụ trách tư vấn {{program_name}} tại
{{brand_name}}.

Em vừa nhận thông tin đăng ký của anh/chị. Em sẽ gọi qua số
{{phone}} trong **24h tới** để mình nói chuyện 30 phút về:

- Hoàn cảnh anh/chị hiện tại
- Mục tiêu trong 6-12 tháng
- Anh/chị có phù hợp với {{program_name}} không

(Đây là buổi tư vấn, không phải pitch. Có khoảng 40% anh/chị em
tư vấn xong em recommend không nên tham gia chương trình vì chưa
phù hợp.)

---

📋 Trước call, anh/chị giúp em 3 việc:

1. **{{prep_item_1}}** — {{prep_explanation_1}}

2. **{{prep_item_2}}** — {{prep_explanation_2}}

3. **{{prep_item_3}}** — {{prep_explanation_3}}

(Tổng khoảng 10-15 phút. Nếu chưa kịp cũng không sao, mình vẫn
nói được — chỉ là call sẽ chậm hơn 1 chút.)

---

🎯 Về {{program_name}}:

{{program_one_liner_from_offer}}

Khác biệt với các chương trình tương tự ngoài thị trường:

- {{differentiator_1}}
- {{differentiator_2}}
- {{differentiator_3}}

(Anh/chị xem chi tiết tại {{landing_page_url}}.)

---

Nếu cần đổi lịch hoặc có việc gấp, anh/chị nhắn Zalo: {{zalo_number}}
— em sẽ adjust.

Hẹn gặp anh/chị trong 24h tới,

— {{sender_name}}
{{brand_name}}
{{sender_title}} | {{linkedin_url}}
```

---

## Pattern P5 — Post-Purchase Onboarding (sau khi pay xong)

**Khi nào**: Triggered từ payment success webhook (`/api/payment-webhook` — Stripe / Momo / ZaloPay / Sepay callback). Lead vừa hoàn tất thanh toán, intent peak, willingness-to-engage cao nhất trong cả funnel.

**Mục tiêu**: (1) confirm + chúc mừng, (2) deliver TOÀN BỘ value đã promise (full deliverables, bonus stack, group link, lịch office hour), (3) ask **1 câu hỏi follow-up** open-ended nhưng narrow để personalize experience sau (anh/chị reply ngay vì còn high-engagement, em có info để cá nhân hoá email/call tiếp theo).

### Subject variants
- `🎉 Chào mừng anh/chị {{name}} vào {{product_name}} — mở khoá ngay`
- `[Đã kích hoạt] {{product_name}} — link truy cập + bước tiếp theo bên trong`
- `Welcome anh/chị {{name}}! Đây là tất cả những gì em đã hứa ✓`

### Preview text
> Thanh toán đã nhận. Link truy cập + group Telegram + lịch office hour ngay bên trong. Em có 1 câu hỏi nhỏ giúp em hỗ trợ anh/chị tốt hơn...

### Body

```
Chào anh/chị {{name}},

🎉 Em đã nhận thanh toán {{amount_paid}} cho "{{product_name}}".
Em rất vui được đồng hành với anh/chị.

Đây là TẤT CẢ những gì anh/chị nhận:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔓 TRUY CẬP NGAY:

[Mở khoá {{product_name}}] → {{access_url}}

Tài khoản: {{email}}
Mật khẩu tạm: {{temp_password}}
(Đổi sau khi đăng nhập lần đầu.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 ANH/CHỊ NHẬN:

✓ {{deliverable_1_from_offer}}
✓ {{deliverable_2_from_offer}}
✓ {{deliverable_3_from_offer}}
{{#if bonus_1}}
✓ BONUS: {{bonus_1_name}} (trị giá {{bonus_1_value}}) — đã unlock
{{/if}}
{{#if bonus_2}}
✓ BONUS: {{bonus_2_name}} (trị giá {{bonus_2_value}}) — đã unlock
{{/if}}
{{#if bonus_3}}
✓ BONUS: {{bonus_3_name}} (trị giá {{bonus_3_value}}) — đã unlock
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 VÀO GROUP HỌC VIÊN:

Em đã add slot cho anh/chị trong group Telegram private:

[Join group →] {{telegram_invite_url}}

Trong group em hỗ trợ trực tiếp, anh/chị hỏi gì em trả lời trong
24h. Có cả thư viện file đã share trước đó.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 LỊCH OFFICE HOUR:

Mỗi {{office_hour_day}} hàng tuần, {{office_hour_time}} — em mở
Zoom Q&A 1 tiếng, miễn phí, anh/chị join bất kỳ tuần nào.

[Lịch + Zoom link] → {{office_hour_url}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ EM XIN HỎI ANH/CHỊ 1 CÂU:

{{personalization_question}}

(Anh/chị reply email này 1-2 câu thôi, không cần dài. Em đọc tất
cả và sẽ điều chỉnh hỗ trợ cho phù hợp.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hoá đơn VAT (nếu anh/chị cần xuất): {{invoice_url}} hoặc reply
email này em xử lý.

Cảm ơn anh/chị đã tin tưởng. Hẹn gặp trong group,

— {{sender_name}}
{{brand_name}} | {{website_url}}
Zalo hỗ trợ riêng: {{zalo_number}}
```

### Gợi ý `personalization_question` theo loại offer

| Offer type | Câu hỏi follow-up gợi ý |
|---|---|
| Khoá học AI / tech | "Anh/chị đang ở giai đoạn nào của journey này? (vừa bắt đầu / đã tự học vài tháng / đã có pet project / đang làm full-time)" |
| Personal branding | "Anh/chị đang build personal brand cho ngách nào? Audience target là ai?" |
| Coaching 1-1 | "1 vấn đề LỚN NHẤT anh/chị muốn giải quyết trong 30 ngày tới là gì?" |
| Template/swipe file | "Anh/chị định dùng template này cho project/khách hàng gì cụ thể?" |
| Done-for-you service | "Em cần biết: dự án anh/chị đang ở stage nào — chưa có gì / có ý tưởng / có MVP / đang scale?" |

**Quy tắc câu hỏi**:
- 1 câu duy nhất, không 3-4 câu như form survey.
- Open-ended nhưng narrow (có hint trong dấu ngoặc) — giúp lead reply nhanh < 30s.
- Phục vụ personalization sau, không hỏi cho có.

### KHÔNG đưa vào P5
- ❌ Pitch upsell ngay email đầu — quá thiếu tinh tế, mất trust. Chờ ít nhất 1 tuần.
- ❌ Hỏi rating/review email đầu — họ chưa dùng sản phẩm.
- ❌ Câu hỏi multi-choice giống form — lead skip.
- ❌ Câu hỏi quá rộng kiểu "anh/chị thấy thế nào?" — không actionable cho personalization.

---

## Owner Notification Email (tất cả pattern dùng chung)

Plain text, ngắn, info-dense. Owner cần đọc trên mobile trong 10 giây.

### Subject
```
🔥 Lead {{pattern_label}} — {{name}} ({{phone}}) — {{page_slug}}
```

Ví dụ: `🔥 Lead P4 (high-ticket) — Anh Tony (0901234567) — ai-agent-course`

### Body

```
Lead mới từ {{landing_page_url}}

────────────────────────────────
Tên:       {{name}}
SĐT:       {{phone_formatted}}
Email:     {{email}}
Source:    {{utm_source || 'direct'}}
Campaign:  {{utm_campaign || '-'}}
Thời gian: {{timestamp_vn}} ({{time_ago}})
IP/Region: {{ip_region || 'unknown'}}
────────────────────────────────

Action gợi ý cho pattern {{pattern}}:
{{action_per_pattern}}

Quick actions:
- Gọi:   tel:{{phone}}
- Zalo:  https://zalo.me/{{phone_clean}}
- Email: mailto:{{email}}

Resend log: https://resend.com/emails (search "{{email}}")
```

`action_per_pattern` mapping:
- P1: "Lead vừa nhận PDF. Wait 48h trước khi follow-up. Theo dõi xem có click link tải không qua Resend log."
- P2: "Đã hứa call trong {{response_window}}. Đặt reminder. Confirm lịch qua Zalo trước cho chắc."
- P3: "Đã gửi link thanh toán. Check Stripe/payment provider sau 2h. Chưa pay → nhắc Zalo 1 lần."
- P4: "**HOT LEAD** — gọi trong 5 phút. Intent peak. Sau 1h, drop conversion 50%."

---

## Personalization rules

1. **`{{name}}` extraction**: Nếu user nhập "Nguyễn Văn A" → extract "A" cho informal hoặc "anh A" cho formal. Nếu chỉ có "Tony" → dùng nguyên. Tránh "Nguyễn Văn A" full trong body — quá formal.

2. **`{{phone}}` formatting**: Input "0901234567" → display "0901 234 567" trong email body. Trong subject vẫn để liền cho ngắn.

3. **`{{timestamp_vn}}`**: Convert UTC sang Asia/Ho_Chi_Minh, format "14h30 ngày 14/05/2026". Không "5/14/2026 7:30 AM UTC".

4. **Nếu offer.json không có 1 field cần thiết**: skill phải đoán reasonable default từ context, hoặc dừng hỏi user. Không leave `{{undefined}}` trong email gửi đi.

---

## Anti-pattern email content (đừng viết)

- ❌ "We thank you for your submission" → quá Tây, không tiếng Việt thuần.
- ❌ "Bạn đã đăng ký thành công!" → cụt lủn, không deliver gì.
- ❌ "Vui lòng đợi 24h để được hỗ trợ" → set expectation thấp, lead nguội.
- ❌ "Sản phẩm/dịch vụ tốt nhất Việt Nam" → claim rỗng, spam-y.
- ❌ Email body 800+ từ → mobile không đọc nổi, dùng < 250 từ.
- ❌ 3-4 CTA button khác màu → choice paralysis, 1 primary CTA thôi.
- ❌ Image-heavy email (hero banner full-width) → load chậm mobile VN 4G, dễ bị clip trong Gmail.
- ❌ Quên `{{phone}}` formatting → "0901234567" liền hiển thị xấu.
