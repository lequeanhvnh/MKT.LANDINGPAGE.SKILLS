# Module 05 — Revit Add-in Core (LicenseClient + CanRun)

**Mục tiêu:** Lõi license phía Revit: lấy device id, activate, cache entitlement token, verify Ed25519 offline, `CanRun(commandId)` gọi mỗi command, xử lý offline grace.

**Phụ thuộc:** Module 02 (activate/refresh), Module 04 (access_token).

**Deliverables (C#/.NET):**
```
License/
  DeviceId.cs            // fingerprint máy
  EntitlementToken.cs    // model + parse JWT
  Ed25519Verifier.cs     // verify chữ ký (BouncyCastle/NSec)
  TokenCache.cs          // lưu token DPAPI
  LicenseClient.cs       // Activate/Refresh/CanRun
  RequiresProductAttribute.cs
App/
  Application.cs         // IExternalApplication OnStartup → init
  CommandBase.cs         // wrapper Execute: check + telemetry
```

## DeviceId

- [ ] Hash SHA-256 từ: `MachineGuid` (HKLM\SOFTWARE\Microsoft\Cryptography) + Windows SID + CPU id.
- [ ] Ổn định qua các lần mở, không lộ PII. Cache trong RAM.

## LicenseClient.CanRun(commandId) — thuật toán (xem doc gốc 4.4)

```
product = Registry.RequiredProduct(commandId)
token = Cache.Load()
if token == null: token = await Activate()        // gọi mạng 1 lần
if !Ed25519Verifier.Verify(token, publicKeyByKid): return Deny("token lỗi")

if Now < token.exp:
    return token.disciplines.Contains(product) ? Allow : Deny("chưa kích hoạt")

// hết hạn
if Network.Available:
    token = await Refresh(token); Cache.Save(token)
    return token.disciplines.Contains(product) ? Allow : Deny()
else:
    if Now < token.grace_until:
        return token.disciplines.Contains(product) ? Allow : Deny()
    return Deny("Cần kết nối mạng để xác thực lại")
```

## Task checklist

- [ ] Nhúng **public key + kid** (resource), hỗ trợ nhiều kid để xoay khóa.
- [ ] `Activate()`: gọi `/activate` với access_token → lưu token cache.
- [ ] `Refresh()` ngầm khi token gần hết hạn (background, không chặn).
- [ ] `TokenCache`: DPAPI tại `%APPDATA%/<App>/entitlement.dat`.
- [ ] `RequiresProductAttribute("ARC")` gắn lên mỗi command; Registry map command→product (load từ `command_registry` hoặc hardcode).
- [ ] `CommandBase.Execute`: gọi CanRun → nếu Deny hiện popup upsell (link mua/gia hạn web) → return Cancelled; nếu Allow chạy logic + log telemetry (module 06).
- [ ] Banner "còn N ngày offline" khi đang dùng grace.
- [ ] OnStartup: init LicenseClient, nếu chưa đăng nhập → mở LoginWindow (module 04).

## Acceptance criteria

- [ ] Command bộ môn đã mua → chạy; bộ môn chưa mua → popup upsell.
- [ ] Sửa tay file `entitlement.dat` → verify fail → buộc activate lại.
- [ ] Ngắt mạng: trong grace vẫn chạy; quá grace bị chặn yêu cầu online.
- [ ] Verify Ed25519 < 5ms (đo) → không lag khi bấm command liên tục.
- [ ] Token hết hạn + có mạng → tự refresh trong suốt với user.
