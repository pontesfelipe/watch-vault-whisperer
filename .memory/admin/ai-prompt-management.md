---
name: AI Prompt Management
description: Watch image generation prompts live in the ai_prompt_templates table and are edited from Admin > Tools > AI Prompts
type: feature
---
- Table `ai_prompt_templates` (admin-only RLS) stores four keys: `watch_image_system`, `watch_image_composition_rules`, `watch_image_pure_generation`, `watch_image_reference_enhanced`.
- Each row keeps `template` (live) and `default_template` (for "Reset to default").
- `generate-watch-image` edge function loads templates at request time and renders `{{placeholder}}` tokens (`brand`, `model`, `cues`, `identity`, `composition_rules`, `official_name`, `required_elements`, `forbidden_elements`). Hardcoded constants remain as fallback if a row is missing/empty.
- Admin UI: `src/components/admin/AIPromptsTab.tsx`, mounted in Admin > Tools tabs as "AI Prompts".
