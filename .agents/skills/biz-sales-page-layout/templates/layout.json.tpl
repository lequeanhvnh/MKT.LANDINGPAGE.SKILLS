{
  "version": "1.0",
  "schema": "biz-sales-page-layout/v1",
  "metadata": {
    "slug": "{{SLUG}}",
    "product_name": "{{PRODUCT_NAME}}",
    "generated_at": "{{TIMESTAMP_ISO}}",
    "input_mode": "{{MODE}}",
    "source_offer_json": "{{OFFER_JSON_PATH_OR_NULL}}",
    "language": "vi",
    "target_market": "vietnam"
  },
  "anchor": {
    "segment": "{{SEGMENT}}",
    "dream_outcome": "{{DREAM_OUTCOME}}",
    "pains": {
      "functional": "{{PAIN_FUNCTIONAL}}",
      "emotional": "{{PAIN_EMOTIONAL}}",
      "social": "{{PAIN_SOCIAL}}"
    },
    "gains": {
      "required": "{{GAIN_REQUIRED}}",
      "expected": "{{GAIN_EXPECTED}}",
      "desired": "{{GAIN_DESIRED}}"
    }
  },
  "hero": {
    "hook_type": "{{HOOK_TYPE}}",
    "headline": "{{HEADLINE}}",
    "subheading": "{{SUBHEADING}}",
    "value_prop_three": [
      {
        "name": "{{VALUE_PROP_1_NAME}}",
        "why": "{{VALUE_PROP_1_WHY}}"
      },
      {
        "name": "{{VALUE_PROP_2_NAME}}",
        "why": "{{VALUE_PROP_2_WHY}}"
      },
      {
        "name": "{{VALUE_PROP_3_NAME}}",
        "why": "{{VALUE_PROP_3_WHY}}"
      }
    ],
    "credibility": {
      "who": "{{CREDIBILITY_WHO}}",
      "background": "{{CREDIBILITY_BACKGROUND}}",
      "research_or_stat": "{{CREDIBILITY_RESEARCH}}"
    },
    "cta": {
      "button_text": "{{CTA_BUTTON_TEXT}}",
      "microcopy_below": "{{CTA_MICROCOPY}}",
      "next_step": "{{CTA_NEXT_STEP}}",
      "time_low": "{{CTA_TIME_LOW}}",
      "risk_free": "{{CTA_RISK_FREE}}",
      "immediate_value": "{{CTA_IMMEDIATE_VALUE}}"
    },
    "visual_notes": "{{HERO_VISUAL_NOTES}}"
  },
  "sections": [
    {
      "id": "pain-agitation",
      "order": 2,
      "purpose": "Amplify pain, make status quo unbearable",
      "headline": "{{PAIN_SECTION_HEADLINE}}",
      "opening": "{{PAIN_OPENING_PARAGRAPH}}",
      "bullets": [
        {
          "type": "functional",
          "pain": "{{PAIN_BULLET_1}}",
          "consequence": "{{PAIN_BULLET_1_CONSEQUENCE}}"
        },
        {
          "type": "emotional",
          "pain": "{{PAIN_BULLET_2}}",
          "consequence": "{{PAIN_BULLET_2_CONSEQUENCE}}"
        },
        {
          "type": "social",
          "pain": "{{PAIN_BULLET_3}}",
          "consequence": "{{PAIN_BULLET_3_CONSEQUENCE}}"
        }
      ],
      "deepest_pain_line": "{{DEEPEST_PAIN_LINE}}",
      "future_negative": "{{FUTURE_NEGATIVE_OUTCOME}}",
      "visual_notes": "Muted gray / dark navy background, subtle negative imagery",
      "cta": "none"
    },
    {
      "id": "solution-mechanism",
      "order": 3,
      "purpose": "Position offer + name unique mechanism",
      "mechanism_name": "{{MECHANISM_NAME}}",
      "mechanism_one_liner": "{{MECHANISM_ONE_LINER}}",
      "old_approach": "{{OLD_APPROACH}}",
      "unique_twist": "{{UNIQUE_TWIST}}",
      "primary_benefit": "{{PRIMARY_BENEFIT}}",
      "timeframe": "{{TIMEFRAME}}",
      "steps": [
        {"order": 1, "name": "{{STEP_1_NAME}}", "description": "{{STEP_1_DESC}}"},
        {"order": 2, "name": "{{STEP_2_NAME}}", "description": "{{STEP_2_DESC}}"},
        {"order": 3, "name": "{{STEP_3_NAME}}", "description": "{{STEP_3_DESC}}"}
      ],
      "why_this_works": "{{WHY_THIS_WORKS_PARAGRAPH}}",
      "visual_notes": "White/light background, 4 step icon row, mechanism name highlighted",
      "cta": "none"
    },
    {
      "id": "benefits-cascade",
      "order": 4,
      "purpose": "Paint after-state",
      "headline": "Khi anh/chị áp dụng {{MECHANISM_NAME}}, đây là những gì sẽ thay đổi:",
      "benefits": [
        {"outcome": "{{BENEFIT_1}}", "lifestyle_impact": "{{BENEFIT_1_LIFESTYLE}}"},
        {"outcome": "{{BENEFIT_2}}", "lifestyle_impact": "{{BENEFIT_2_LIFESTYLE}}"},
        {"outcome": "{{BENEFIT_3}}", "lifestyle_impact": "{{BENEFIT_3_LIFESTYLE}}"},
        {"outcome": "{{BENEFIT_4}}", "lifestyle_impact": "{{BENEFIT_4_LIFESTYLE}}"},
        {"outcome": "{{BENEFIT_5}}", "lifestyle_impact": "{{BENEFIT_5_LIFESTYLE}}"},
        {"outcome": "{{BENEFIT_6}}", "lifestyle_impact": "{{BENEFIT_6_LIFESTYLE}}"}
      ],
      "visualization_block": "{{VISUALIZATION_BLOCK}}",
      "visual_notes": "Icon per benefit, zigzag alignment, after-state imagery",
      "cta": "primary_repeat"
    },
    {
      "id": "social-proof",
      "order": 5,
      "purpose": "Remove doubt through evidence",
      "headline": "{{N_CUSTOMERS}} {{CUSTOMER_TYPE}} đã đi qua hệ thống này",
      "testimonials": [
        {
          "name": "{{TESTIMONIAL_1_NAME}}",
          "role": "{{TESTIMONIAL_1_ROLE}}",
          "photo_url": "{{TESTIMONIAL_1_PHOTO}}",
          "quote": "{{TESTIMONIAL_1_QUOTE}}",
          "segment_match": "primary"
        },
        {
          "name": "{{TESTIMONIAL_2_NAME}}",
          "role": "{{TESTIMONIAL_2_ROLE}}",
          "photo_url": "{{TESTIMONIAL_2_PHOTO}}",
          "quote": "{{TESTIMONIAL_2_QUOTE}}",
          "segment_match": "different_demographic"
        },
        {
          "name": "{{TESTIMONIAL_3_NAME}}",
          "role": "{{TESTIMONIAL_3_ROLE}}",
          "photo_url": "{{TESTIMONIAL_3_PHOTO}}",
          "quote": "{{TESTIMONIAL_3_QUOTE}}",
          "segment_match": "skeptic_turned_believer"
        }
      ],
      "stats": {
        "operation_duration": "{{OPERATION_DURATION}}",
        "n_customers": "{{N_CUSTOMERS}}",
        "percentage_success": "{{PERCENTAGE_SUCCESS}}",
        "primary_outcome": "{{PRIMARY_OUTCOME}}",
        "n_top_tier": "{{N_TOP_TIER}}",
        "top_result": "{{TOP_RESULT}}"
      },
      "testimonial_gap_flag": "{{TESTIMONIAL_GAP_NOTE_IF_ANY}}",
      "visual_notes": "Real photos, video testimonial preferred, mix segment, verification badges"
    },
    {
      "id": "offer-stack",
      "order": 6,
      "purpose": "Build perceived value 10x giá",
      "core_offer": {
        "name": "{{CORE_OFFER_NAME}}",
        "description": "{{CORE_OFFER_DESCRIPTION}}",
        "components": [
          {"name": "{{CORE_COMPONENT_1}}", "benefit": "{{CORE_COMPONENT_1_BENEFIT}}"},
          {"name": "{{CORE_COMPONENT_2}}", "benefit": "{{CORE_COMPONENT_2_BENEFIT}}"},
          {"name": "{{CORE_COMPONENT_3}}", "benefit": "{{CORE_COMPONENT_3_BENEFIT}}"},
          {"name": "{{CORE_COMPONENT_4}}", "benefit": "{{CORE_COMPONENT_4_BENEFIT}}"}
        ],
        "standalone_value_vnd": "{{CORE_VALUE}}"
      },
      "bonuses": [
        {
          "order": 1,
          "name": "{{BONUS_1_NAME}}",
          "description": "{{BONUS_1_DESCRIPTION}}",
          "value_vnd": "{{BONUS_1_VALUE}}",
          "category": "{{BONUS_1_CATEGORY}}",
          "fast_action": false
        },
        {
          "order": 2,
          "name": "{{BONUS_2_NAME}}",
          "description": "{{BONUS_2_DESCRIPTION}}",
          "value_vnd": "{{BONUS_2_VALUE}}",
          "category": "{{BONUS_2_CATEGORY}}",
          "fast_action": false
        },
        {
          "order": 3,
          "name": "{{BONUS_3_NAME}}",
          "description": "{{BONUS_3_DESCRIPTION}}",
          "value_vnd": "{{BONUS_3_VALUE}}",
          "category": "{{BONUS_3_CATEGORY}}",
          "fast_action": false
        },
        {
          "order": 4,
          "name": "{{BONUS_4_NAME}}",
          "description": "{{BONUS_4_DESCRIPTION}}",
          "value_vnd": "{{BONUS_4_VALUE}}",
          "category": "fast-action",
          "fast_action": true,
          "fast_action_limit": "30 người đầu"
        }
      ],
      "total_value_vnd": "{{TOTAL_VALUE}}",
      "pricing_tiers": [
        {"tier": "BASIC", "price_vnd": "{{PRICE_BASIC}}", "includes": "Core only"},
        {"tier": "STANDARD", "price_vnd": "{{PRICE_STANDARD}}", "includes": "Core + {{BONUS_COUNT}} bonus + community", "recommended": true},
        {"tier": "PREMIUM", "price_vnd": "{{PRICE_PREMIUM}}", "includes": "Standard + 1-on-1 + priority"}
      ],
      "installment_option": {
        "available": true,
        "n_payments": 3,
        "amount_per_payment_vnd": "{{INSTALLMENT_AMOUNT}}"
      },
      "savings_vnd": "{{SAVINGS_AMOUNT}}",
      "savings_percent": "{{SAVINGS_PERCENT}}",
      "cta": "primary_repeat"
    },
    {
      "id": "guarantee",
      "order": 7,
      "purpose": "Reverse risk",
      "duration": "{{GUARANTEE_DURATION}}",
      "condition": "{{GUARANTEE_CONDITION}}",
      "keep_material_if_refund": "{{KEEP_MATERIAL}}",
      "reason_for_guarantee": "{{REASON_FOR_GUARANTEE}}",
      "type": "{{GUARANTEE_TYPE}}",
      "visual_notes": "Shield badge prominent, place right after offer stack"
    },
    {
      "id": "urgency",
      "order": 8,
      "purpose": "Push decision through truthful scarcity",
      "opening": "{{URGENCY_OPENING_PARAGRAPH}}",
      "elements": {
        "quantity_scarcity": {
          "spots_total": "{{SPOTS_TOTAL}}",
          "spots_filled": "{{SPOTS_FILLED}}",
          "last_update": "{{LAST_UPDATE}}",
          "reason": "{{QUANTITY_REASON}}"
        },
        "fast_action_bonus": "{{FAST_ACTION_DETAIL}}",
        "deadline": {
          "date": "{{DEADLINE}}",
          "next_cohort_gap": "{{NEXT_GAP}}"
        },
        "price_increase": {
          "current_price": "{{PRICE_STANDARD}}",
          "price_deadline": "{{PRICE_DEADLINE}}",
          "price_next": "{{PRICE_NEXT}}"
        }
      },
      "visual_notes": "Progress bar, real-time update timestamp, no fake countdown"
    },
    {
      "id": "faq",
      "order": 9,
      "purpose": "Address 8-12 objections",
      "qa_pairs": [
        {"question": "Em chưa biết gì về {{TOPIC}}, có theo được không?", "answer": "{{FAQ_1_ANSWER}}"},
        {"question": "Em không có nhiều thời gian, mỗi tuần dành bao nhiêu giờ?", "answer": "{{FAQ_2_ANSWER}}"},
        {"question": "Em đã thử nhiều khóa rồi không work, khóa này khác gì?", "answer": "{{FAQ_3_ANSWER}}"},
        {"question": "Giá có quá cao không?", "answer": "{{FAQ_4_ANSWER}}"},
        {"question": "Anh/chị có thực sự coach 1-1 không hay chỉ video?", "answer": "{{FAQ_5_ANSWER}}"},
        {"question": "Có hỗ trợ sau khóa không?", "answer": "{{FAQ_6_ANSWER}}"},
        {"question": "Nếu không đạt result thì sao?", "answer": "{{FAQ_7_ANSWER}}"},
        {"question": "Có thể thanh toán trả góp không?", "answer": "{{FAQ_8_ANSWER}}"},
        {"question": "Khóa này có thực sự phù hợp với em không?", "answer": "{{FAQ_FINAL_ANSWER}}"}
      ],
      "cta": "secondary_after"
    },
    {
      "id": "final-cta",
      "order": 10,
      "purpose": "Last push + recap + emotional appeal",
      "headline": "{{FINAL_CTA_HEADLINE}}",
      "recap_bullets": [
        "{{FINAL_RECAP_1}}",
        "{{FINAL_RECAP_2}}",
        "{{FINAL_RECAP_3}}"
      ],
      "n_bonuses": "{{N_BONUSES}}",
      "bonus_total_value_vnd": "{{BONUS_TOTAL_VALUE}}",
      "urgency_reminder": "{{URGENCY_REMINDER}}",
      "ps_final_insight": "{{PS_FINAL_INSIGHT}}",
      "pps_guarantee_reminder": true,
      "cta": "primary_large"
    }
  ],
  "global_cta": {
    "primary_button_text": "{{CTA_BUTTON_TEXT}}",
    "consistent_across_page": true,
    "placement_count": 5,
    "sticky_mobile_bottom": true
  },
  "footer": {
    "trust_badges": ["Thanh toán an toàn", "Momo", "ZaloPay", "ATM", "VietQR"],
    "guarantee_duration": "{{GUARANTEE_DURATION}}",
    "contact": {
      "email": "{{EMAIL}}",
      "zalo": "{{ZALO_LINK}}",
      "messenger": "{{MESSENGER_LINK}}",
      "hotline": "{{HOTLINE}}"
    },
    "legal_links": ["Chính sách hoàn tiền", "Điều khoản", "Bảo mật"],
    "brand_name": "{{BRAND_NAME}}",
    "address": "{{ADDRESS_IF_ANY}}",
    "tax_code": "{{TAX_CODE_IF_ANY}}",
    "year": "{{YEAR}}"
  },
  "mobile_optimization": {
    "hero_fit_viewport": true,
    "sticky_cta_bottom": true,
    "min_font_size_px": 16,
    "max_paragraph_lines": 3,
    "image_format": "WebP",
    "page_load_target_seconds": 3
  },
  "next_steps_pipeline": {
    "build_html": "/ui-ux-pro-max",
    "deploy_live": "/biz-deploy-vercel",
    "ab_test_hero": "hero-block.md"
  }
}
