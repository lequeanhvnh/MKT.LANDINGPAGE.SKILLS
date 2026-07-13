{
  "version": "1.0",
  "schema": "biz-sales-page-copy/v1",
  "slug": "{{SLUG}}",
  "product_name": "{{PRODUCT_NAME}}",
  "generated_at": "{{ISO_TIMESTAMP}}",
  "source": {
    "layout_md": "output/sales-pages/{{SLUG}}/layout.md",
    "layout_json": "output/sales-pages/{{SLUG}}/layout.json",
    "offer_json": "output/cases/{{SLUG}}/offer.json"
  },
  "intensity_level": {
    "level": {{LEVEL}},
    "name": "{{LEVEL_NAME}}",
    "description": "{{LEVEL_DESCRIPTION}}"
  },
  "voice": {
    "pronoun_you": "{{PRONOUN_YOU}}",
    "pronoun_self": "{{PRONOUN_SELF}}",
    "register": "{{REGISTER}}",
    "vnd_format": "charm"
  },
  "anchor": {
    "segment": "{{SEGMENT}}",
    "dream_outcome": "{{DREAM_OUTCOME}}",
    "pain_exact": {
      "functional": "{{PAIN_FUNCTIONAL_EXACT}}",
      "emotional": "{{PAIN_EMOTIONAL_EXACT}}",
      "social": "{{PAIN_SOCIAL_EXACT}}"
    },
    "gain": {
      "required": "{{GAIN_REQUIRED}}",
      "expected": "{{GAIN_EXPECTED}}",
      "desired": "{{GAIN_DESIRED}}"
    },
    "mechanism_name": "{{MECHANISM_NAME}}",
    "mechanism_one_liner": "{{MECHANISM_ONE_LINER}}",
    "cta_button_text": "{{CTA_BUTTON_TEXT}}"
  },
  "hero": {
    "deployed": {
      "hook_type": "{{HOOK_TYPE}}",
      "headline": "{{HEADLINE_DEPLOYED}}",
      "subheading": "{{SUBHEADING_DEPLOYED}}",
      "value_prop": [
        { "name": "{{VP1_NAME}}", "why": "{{VP1_WHY}}" },
        { "name": "{{VP2_NAME}}", "why": "{{VP2_WHY}}" },
        { "name": "{{VP3_NAME}}", "why": "{{VP3_WHY}}" }
      ],
      "credibility": "{{CREDIBILITY_DEPLOYED}}",
      "cta": {
        "button_text": "{{CTA_BUTTON_TEXT}}",
        "microcopy_below": "{{CTA_MICROCOPY}}"
      }
    },
    "variants": [
      {
        "id": "A",
        "type": "frustration",
        "headline": "{{VARIANT_A_HEADLINE}}",
        "subheading": "{{VARIANT_A_SUBHEADING}}",
        "value_prop": [
          { "name": "{{VA_VP1_NAME}}", "why": "{{VA_VP1_WHY}}" },
          { "name": "{{VA_VP2_NAME}}", "why": "{{VA_VP2_WHY}}" },
          { "name": "{{VA_VP3_NAME}}", "why": "{{VA_VP3_WHY}}" }
        ],
        "credibility": "{{VARIANT_A_CREDIBILITY}}",
        "cta": "{{VARIANT_A_CTA}}",
        "when_to_use": "{{VARIANT_A_WHEN}}",
        "tone_signal": "{{VARIANT_A_TONE}}",
        "expected_resistance": "{{VARIANT_A_RESISTANCE}}",
        "best_traffic": ["fb_ad_pain", "retargeting_cart_abandoned", "email_reactivation"]
      },
      {
        "id": "B",
        "type": "readiness",
        "is_default": true,
        "headline": "{{VARIANT_B_HEADLINE}}",
        "subheading": "{{VARIANT_B_SUBHEADING}}",
        "value_prop": [
          { "name": "{{VB_VP1_NAME}}", "why": "{{VB_VP1_WHY}}" },
          { "name": "{{VB_VP2_NAME}}", "why": "{{VB_VP2_WHY}}" },
          { "name": "{{VB_VP3_NAME}}", "why": "{{VB_VP3_WHY}}" }
        ],
        "credibility": "{{VARIANT_B_CREDIBILITY}}",
        "cta": "{{VARIANT_B_CTA}}",
        "when_to_use": "{{VARIANT_B_WHEN}}",
        "tone_signal": "{{VARIANT_B_TONE}}",
        "expected_resistance": "{{VARIANT_B_RESISTANCE}}",
        "best_traffic": ["seo_organic", "content_marketing", "podcast_youtube"]
      },
      {
        "id": "C",
        "type": "bold_promise",
        "headline": "{{VARIANT_C_HEADLINE}}",
        "subheading": "{{VARIANT_C_SUBHEADING}}",
        "value_prop": [
          { "name": "{{VC_VP1_NAME}}", "why": "{{VC_VP1_WHY}}" },
          { "name": "{{VC_VP2_NAME}}", "why": "{{VC_VP2_WHY}}" },
          { "name": "{{VC_VP3_NAME}}", "why": "{{VC_VP3_WHY}}" }
        ],
        "credibility": "{{VARIANT_C_CREDIBILITY}}",
        "cta": "{{VARIANT_C_CTA}}",
        "when_to_use": "{{VARIANT_C_WHEN}}",
        "tone_signal": "{{VARIANT_C_TONE}}",
        "expected_resistance": "{{VARIANT_C_RESISTANCE}}",
        "best_traffic": ["return_visitor", "comparison_shoppers", "b2b_inbound"]
      }
    ]
  },
  "sections": [
    {
      "id": "pain-agitation",
      "order": 2,
      "formula": "PAR",
      "headline": "{{S2_HEADLINE}}",
      "body": "{{S2_BODY}}",
      "bullets": [
        { "pain": "{{S2_BULLET_1}}", "consequence": "{{S2_CONSEQUENCE_1}}" },
        { "pain": "{{S2_BULLET_2}}", "consequence": "{{S2_CONSEQUENCE_2}}" },
        { "pain": "{{S2_BULLET_3}}", "consequence": "{{S2_CONSEQUENCE_3}}" }
      ],
      "deepest_pain_line": "{{S2_DEEPEST_PAIN}}",
      "resolve_tease": "{{S2_RESOLVE_TEASE}}",
      "power_word_density": { "L1": {{S2_PW_L1}}, "L2": {{S2_PW_L2}}, "L3": {{S2_PW_L3}}, "L4": {{S2_PW_L4}} }
    },
    {
      "id": "solution-bridge",
      "order": 3,
      "formula": "BAB + FEP",
      "headline": "{{S3_HEADLINE}}",
      "bab": {
        "before": "{{S3_BEFORE}}",
        "after": "{{S3_AFTER}}",
        "bridge": "{{S3_BRIDGE}}"
      },
      "mechanism_steps": [
        { "letter": "{{STEP_1_LETTER}}", "name": "{{STEP_1_NAME}}", "tagline": "{{STEP_1_TAGLINE}}", "description": "{{STEP_1_DESC}}", "payoff": "{{STEP_1_PAYOFF}}" },
        { "letter": "{{STEP_2_LETTER}}", "name": "{{STEP_2_NAME}}", "tagline": "{{STEP_2_TAGLINE}}", "description": "{{STEP_2_DESC}}", "payoff": "{{STEP_2_PAYOFF}}" },
        { "letter": "{{STEP_3_LETTER}}", "name": "{{STEP_3_NAME}}", "tagline": "{{STEP_3_TAGLINE}}", "description": "{{STEP_3_DESC}}", "payoff": "{{STEP_3_PAYOFF}}" },
        { "letter": "{{STEP_4_LETTER}}", "name": "{{STEP_4_NAME}}", "tagline": "{{STEP_4_TAGLINE}}", "description": "{{STEP_4_DESC}}", "payoff": "{{STEP_4_PAYOFF}}" }
      ],
      "why_this_works": "{{S3_WHY_WORKS}}"
    },
    {
      "id": "benefits-cascade",
      "order": 4,
      "formula": "FEP-stack",
      "headline": "{{S4_HEADLINE}}",
      "benefits": [
        { "feature": "{{B1_FEATURE}}", "payoff": "{{B1_PAYOFF}}" },
        { "feature": "{{B2_FEATURE}}", "payoff": "{{B2_PAYOFF}}" },
        { "feature": "{{B3_FEATURE}}", "payoff": "{{B3_PAYOFF}}" },
        { "feature": "{{B4_FEATURE}}", "payoff": "{{B4_PAYOFF}}" },
        { "feature": "{{B5_FEATURE}}", "payoff": "{{B5_PAYOFF}}" },
        { "feature": "{{B6_FEATURE}}", "payoff": "{{B6_PAYOFF}}" }
      ],
      "visualization_scene": "{{S4_VISUALIZATION}}",
      "cta_repeat": true
    },
    {
      "id": "social-proof",
      "order": 5,
      "formula": "Star-Chain-Hook",
      "headline": "{{S5_HEADLINE}}",
      "testimonials": [
        {
          "name": "{{T1_NAME}}",
          "age_role": "{{T1_AGE_ROLE}}",
          "location": "{{T1_LOCATION}}",
          "linkedin": "{{T1_LINKEDIN}}",
          "photo_url": "{{T1_PHOTO_URL}}",
          "star": "{{T1_STAR}}",
          "chain": "{{T1_CHAIN}}",
          "hook": "{{T1_HOOK}}"
        },
        {
          "name": "{{T2_NAME}}",
          "age_role": "{{T2_AGE_ROLE}}",
          "location": "{{T2_LOCATION}}",
          "linkedin": "{{T2_LINKEDIN}}",
          "photo_url": "{{T2_PHOTO_URL}}",
          "star": "{{T2_STAR}}",
          "chain": "{{T2_CHAIN}}",
          "hook": "{{T2_HOOK}}"
        },
        {
          "name": "{{T3_NAME}}",
          "age_role": "{{T3_AGE_ROLE}}",
          "location": "{{T3_LOCATION}}",
          "linkedin": "{{T3_LINKEDIN}}",
          "photo_url": "{{T3_PHOTO_URL}}",
          "star": "{{T3_STAR}}",
          "chain": "{{T3_CHAIN}}",
          "hook": "{{T3_HOOK}}"
        }
      ],
      "data_stats": {
        "n_customers": {{N_CUSTOMERS}},
        "operation_duration": "{{OPERATION_DURATION}}",
        "percentage_success": {{PERCENTAGE_SUCCESS}},
        "primary_outcome": "{{PRIMARY_OUTCOME}}",
        "timeframe": "{{TIMEFRAME}}",
        "n_top_tier": {{N_TOP_TIER}},
        "top_result": "{{TOP_RESULT}}"
      },
      "gap_note": "{{S5_GAP_NOTE}}"
    },
    {
      "id": "offer-stack",
      "order": 6,
      "formula": "value-anchor + reciprocity",
      "core": {
        "name": "{{CORE_OFFER_NAME}}",
        "duration": "{{CORE_DURATION}}",
        "description": "{{CORE_DESCRIPTION}}",
        "components": [
          { "name": "{{CC1_NAME}}", "spec": "{{CC1_SPEC}}", "payoff": "{{CC1_PAYOFF}}" },
          { "name": "{{CC2_NAME}}", "spec": "{{CC2_SPEC}}", "payoff": "{{CC2_PAYOFF}}" },
          { "name": "{{CC3_NAME}}", "spec": "{{CC3_SPEC}}", "payoff": "{{CC3_PAYOFF}}" },
          { "name": "{{CC4_NAME}}", "spec": "{{CC4_SPEC}}", "payoff": "{{CC4_PAYOFF}}" }
        ],
        "standalone_value_vnd": {{CORE_VALUE}}
      },
      "bonuses": [
        { "id": 1, "name": "{{B1_NAME}}", "value_vnd": {{B1_VALUE}}, "description": "{{B1_DESC}}", "fast_action": false },
        { "id": 2, "name": "{{B2_NAME}}", "value_vnd": {{B2_VALUE}}, "description": "{{B2_DESC}}", "fast_action": false },
        { "id": 3, "name": "{{B3_NAME}}", "value_vnd": {{B3_VALUE}}, "description": "{{B3_DESC}}", "fast_action": false },
        { "id": 4, "name": "{{B4_NAME}}", "value_vnd": {{B4_VALUE}}, "description": "{{B4_DESC}}", "fast_action": true, "limit_quantity": 30, "remaining": {{B4_REMAINING}} }
      ],
      "total_value_vnd": {{TOTAL_VALUE}},
      "savings_amount_vnd": {{SAVINGS_AMOUNT}},
      "savings_percent": {{SAVINGS_PERCENT}},
      "pricing_tiers": [
        { "tier": "BASIC", "price_vnd": {{PRICE_BASIC}}, "includes": "Core only (components 1-2)" },
        { "tier": "STANDARD", "price_vnd": {{PRICE_STANDARD}}, "includes": "Core + 4 Bonus + Hotseat", "is_recommended": true, "percent_choose": {{STANDARD_PERCENT}} },
        { "tier": "PREMIUM", "price_vnd": {{PRICE_PREMIUM}}, "includes": "Standard + 1-on-1 + Priority" }
      ],
      "installment": {
        "available": true,
        "kỳ_count": 3,
        "amount_vnd": {{INSTALLMENT_AMOUNT}},
        "interest_free": true
      }
    },
    {
      "id": "guarantee",
      "order": 7,
      "formula": "risk-reversal",
      "duration_days": {{GUARANTEE_DAYS}},
      "condition": "{{GUARANTEE_CONDITION}}",
      "kept_materials": "{{KEPT_MATERIAL}}",
      "reason_with_data": "{{GUARANTEE_REASON_DATA}}"
    },
    {
      "id": "urgency",
      "order": 8,
      "formula": "honest-scarcity",
      "spots": { "filled": {{SPOTS_FILLED}}, "total": {{SPOTS_TOTAL}}, "last_update": "{{LAST_UPDATE}}" },
      "fast_action_bonus": { "name": "{{B4_NAME}}", "remaining": {{B4_REMAINING}}, "limit": 30 },
      "cohort": { "name": "{{COHORT_NAME}}", "deadline": "{{DEADLINE_TIMESTAMP}}", "next_gap": "{{NEXT_GAP}}", "gap_reason": "{{NEXT_GAP_REASON}}" },
      "price_deadline": { "deadline": "{{PRICE_DEADLINE}}", "current_vnd": {{PRICE_STANDARD}}, "next_vnd": {{PRICE_NEXT}} }
    },
    {
      "id": "faq",
      "order": 9,
      "formula": "OARE",
      "questions": [
        { "id": 1, "objection": "{{FAQ_1_Q}}", "answer": "{{FAQ_1_A}}", "category": "money" },
        { "id": 2, "objection": "{{FAQ_2_Q}}", "answer": "{{FAQ_2_A}}", "category": "time" },
        { "id": 3, "objection": "{{FAQ_3_Q}}", "answer": "{{FAQ_3_A}}", "category": "competitor" },
        { "id": 4, "objection": "{{FAQ_4_Q}}", "answer": "{{FAQ_4_A}}", "category": "guarantee" },
        { "id": 5, "objection": "{{FAQ_5_Q}}", "answer": "{{FAQ_5_A}}", "category": "delivery" },
        { "id": 6, "objection": "{{FAQ_6_Q}}", "answer": "{{FAQ_6_A}}", "category": "beginner" },
        { "id": 7, "objection": "{{FAQ_7_Q}}", "answer": "{{FAQ_7_A}}", "category": "support" },
        { "id": 8, "objection": "{{FAQ_8_Q}}", "answer": "{{FAQ_8_A}}", "category": "logistic" }
      ]
    },
    {
      "id": "final-cta",
      "order": 10,
      "formula": "PVEN + emotional P.S.",
      "deployed_variant": "{{FINAL_CTA_DEPLOYED_VARIANT}}",
      "headline": "{{FINAL_HEADLINE}}",
      "pven": {
        "promise": "{{PROMISE_LINE}}",
        "vision": "{{VISION_PARAGRAPH}}",
        "evidence": "{{EVIDENCE_PARAGRAPH}}",
        "nudge": "{{NUDGE_PARAGRAPH}}"
      },
      "recap_bullets": ["{{RECAP_1}}", "{{RECAP_2}}", "{{RECAP_3}}"],
      "urgency_reminder_final": "{{URGENCY_REMINDER_FINAL}}",
      "ps": "{{PS_EMOTIONAL}}",
      "pps": "{{PPS_RISK_REVERSAL}}"
    }
  ],
  "cta_variants": [
    { "id": "A", "pattern": "action-direct", "text": "{{CTA_VARIANT_A}}", "when_to_use": "Final CTA, audience pain-aware ready-to-buy" },
    { "id": "B", "pattern": "benefit-first", "text": "{{CTA_VARIANT_B}}", "when_to_use": "Mid-page CTA (sau Benefits, sau Mechanism)" },
    { "id": "C", "pattern": "identity-led", "text": "{{CTA_VARIANT_C}}", "when_to_use": "Hero CTA (cold audience), softer commit" }
  ],
  "final_cta_variants": [
    { "id": "A", "style": "urgent-recap", "headline": "{{FINAL_A_HEADLINE}}", "best_for": "last-day cohort, decided audience", "length_words": {{FINAL_A_LEN}} },
    { "id": "B", "style": "emotional-close", "headline": "{{FINAL_B_HEADLINE}}", "best_for": "cold audience, first launch", "length_words": {{FINAL_B_LEN}} },
    { "id": "C", "style": "logical-close", "headline": "{{FINAL_C_HEADLINE}}", "best_for": "B2B analytical, ROI-driven", "length_words": {{FINAL_C_LEN}} }
  ],
  "formulas_applied": {
    "pain": "PAR",
    "solution": "BAB",
    "mechanism": "FEP + 1-2-3-4",
    "benefit": "FEP-stack",
    "testimonial": "Star-Chain-Hook",
    "offer": "value-anchor + reciprocity",
    "guarantee": "risk-reversal",
    "urgency": "honest-scarcity",
    "faq": "OARE",
    "final": "PVEN"
  },
  "power_words_density": {
    "level_1_subtle": {{PW_L1_TOTAL}},
    "level_2_moderate": {{PW_L2_TOTAL}},
    "level_3_strong": {{PW_L3_TOTAL}},
    "level_4_maximum": {{PW_L4_TOTAL}},
    "ratio_l1_l2": {{RATIO_L1_L2}},
    "passes_80_20_rule": {{PASSES_RULE}}
  },
  "ab_test_recommendation": {
    "round_1": {
      "variants": ["hero_A_frustration", "hero_B_readiness"],
      "hypothesis": "Audience awareness level — pain-aware vs desire-aware",
      "min_sample_per_variant": 200,
      "min_duration_days": 7,
      "primary_metric": "conversion_rate"
    },
    "round_2": {
      "variants": ["winner_round_1", "hero_C_bold_promise"],
      "hypothesis": "Refinement test — specificity-heavy vs winner",
      "min_sample_per_variant": 200,
      "min_duration_days": 7,
      "primary_metric": "conversion_rate"
    },
    "default_deploy": {
      "hero": "B (readiness)",
      "cta_button_hero_final": "A (action-direct)",
      "cta_button_mid_page": "B (benefit-first)",
      "final_cta_style": "B (emotional)"
    }
  },
  "next_steps": [
    "Review copy-changes.md để audit từng change",
    "Mobile preview copy-upgraded.md để check hero fit viewport",
    "Build HTML qua /ui-ux-pro-max từ copy-upgraded.md",
    "Deploy qua /biz-deploy-vercel",
    "Sau 7 ngày traffic, run A/B test theo ab_test_recommendation.round_1"
  ]
}
