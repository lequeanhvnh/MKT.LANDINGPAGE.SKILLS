# Hero Block — {{PRODUCT_NAME}}

> Block above-the-fold paste-ready cho A/B test.
> **Hook type chính**: {{HOOK_TYPE}}
> **Slug**: `{{SLUG}}`

---

## 🅰️ Variant chính ({{HOOK_TYPE}})

### Headline
> {{HEADLINE}}

### Subheading
> {{SUBHEADING}}

### Value Proposition — 3 thứ measurable
> Hệ thống này sẽ giúp anh/chị xây dựng và đo lường 3 thứ:
>
> 🎯 **{{VALUE_PROP_1_NAME}}** — {{VALUE_PROP_1_WHY}}
> 🎯 **{{VALUE_PROP_2_NAME}}** — {{VALUE_PROP_2_WHY}}
> 🎯 **{{VALUE_PROP_3_NAME}}** — {{VALUE_PROP_3_WHY}}

### Credibility
> {{CREDIBILITY_BLOCK}}

### CTA
```
[BUTTON: {{CTA_BUTTON_TEXT}} →]
{{CTA_MICROCOPY}}
```

---

## 🅱️ Variant alternate (để A/B test)

### Headline alternate ({{ALTERNATE_HOOK_TYPE}})
> {{ALTERNATE_HEADLINE}}

### Subheading alternate
> {{ALTERNATE_SUBHEADING}}

(Value prop, credibility, CTA giữ nguyên cho consistency test)

---

## 🅲️ Variant secondary (test thứ 3 nếu muốn)

### Headline ({{SECONDARY_HOOK_TYPE}})
> {{SECONDARY_HEADLINE}}

### Subheading
> {{SECONDARY_SUBHEADING}}

---

## 📊 A/B Test Recommendations

**Tuần 1-2**: Run Variant A vs Variant B với 50/50 split. Target sample size: 500 visits.

**Metric chính**:
- Click-through rate trên CTA button
- Scroll depth (đến Section 6 Offer Stack chưa)

**Metric phụ**:
- Time on page
- Bounce rate

**Quyết định**: Variant nào có CTR cao hơn ≥15% → giữ làm primary. Else, test variant C.

---

## 🎨 Visual Direction

**Hero image**:
- Type: {{HERO_IMAGE_DESCRIPTION}}
- Recommend: Real founder photo + result dashboard / before-after / lifestyle shot
- Avoid: stock photo generic Western

**Layout**:
- Headline + subheading + value prop ở 50% bên trái
- Image / video 50% bên phải (desktop)
- Mobile: stack vertical, CTA ngay sau credibility

**Color**:
- CTA button: high-contrast (orange/red trên white) — convert tốt hơn blue 32%
- Headline: dark navy / black trên white background
- Value prop icons: brand color accent

**Mobile check**:
- Hero phải fit 1 viewport (375x667 iPhone SE smallest)
- CTA visible without scroll
- Font headline 28-36px mobile, body 16-18px

---

## 🚀 Implementation

Sau khi pick variant winning:
1. Copy block headline + subhead + value prop + credibility + CTA vào page builder hoặc HTML
2. Test mobile-first trước desktop
3. Connect CTA button đến checkout / contact form
4. Set up analytics tracking event "hero_cta_click"
