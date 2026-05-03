-- ============================================================================
-- Ornalens: Templates & Favorites + Photo Jobs tracking
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ── 1. Templates table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'All',
  thumbnail_url TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  default_aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Anyone can read templates (public catalogue)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are publicly readable"
  ON templates FOR SELECT
  USING (true);

-- ── 2. User Favorites table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON user_favorites FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

-- Index for fast lookup
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_template ON user_favorites(template_id);

-- ── 3. Seed the 18 starter templates ────────────────────────────────────────
INSERT INTO templates (id, title, description, category, thumbnail_url, prompt, default_aspect_ratio, sort_order)
VALUES
  ('tpl_01', 'Elegant Pastel Blue Tabletop',
   'Jewelry should be 100% match as per the shared image. A bright, airy tabletop setting with soft pastel blue velvet backdrop and natural window light.',
   'Necklaces',
   'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
   'Professional jewellery product photography, elegant pastel blue velvet backdrop, soft natural window light from the left, jewellery placed on a delicate glass display stand, clean minimal composition, sharp focus on jewellery details, luxury catalogue shot, 4K, photorealistic',
   '1:1', 1),

  ('tpl_02', 'Luxurious Maroon & Gold',
   'Create a premium jewellery tabletop photoshoot in a rich, luxurious maroon and gold setting with silk drapes.',
   'Necklaces',
   'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
   'Premium jewellery photography, rich maroon silk cloth with gold zari border, warm golden lighting, jewellery displayed elegantly on the fabric, subtle smoke effect for royal atmosphere, temple-inspired golden miniature in backdrop, sharp focus on jewellery, luxury Indian aesthetic, 4K',
   '4:5', 2),

  ('tpl_03', 'High-Fashion Indian Bridal',
   'Create a high-fashion Indian bridal photoshoot featuring a model wearing the jewellery in an editorial setting.',
   'Necklaces',
   'https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=400&h=400&fit=crop',
   'High-fashion Indian bridal editorial, beautiful Indian model wearing the jewellery, rich red and gold lehenga, dramatic studio lighting, luxury wedding magazine cover style, bokeh background with warm golden tones, 4K, photorealistic',
   '4:5', 3),

  ('tpl_04', 'Emerald Ring Frozen Ice',
   'Cinematic close-up of the jewellery on a frozen ice crystal surface with cool blue lighting.',
   'Rings',
   'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
   'Cinematic jewellery photography, ring placed on a frozen ice crystal surface, cool blue and white lighting, water droplets and frost crystals around the jewellery, dramatic macro close-up, sharp focus on gemstones, luxury advertisement style, 4K',
   '1:1', 4),

  ('tpl_05', 'Elegant Silver on Marble',
   'Jewelry should be 100% match as per the shared image. High-end silver earrings displayed on a white marble surface.',
   'Earrings',
   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
   'Luxury jewellery product photography, earrings elegantly placed on polished white marble surface with grey veins, soft diffused studio lighting, minimal clean background, small green eucalyptus leaves for accent, sharp focus, catalogue quality, 4K',
   '1:1', 5),

  ('tpl_06', 'Luxurious Engagement Ring',
   'Jewelry should be 100% match as per the shared image. A breathtaking close-up on a satin pillow.',
   'Rings',
   'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',
   'Luxury engagement ring photography, ring placed on a soft ivory satin pillow, warm romantic lighting, bokeh background with rose petals, extreme macro detail on diamond facets, dreamy soft glow, wedding advertisement quality, 4K',
   '3:2', 6),

  ('tpl_07', 'Crossover Ring on Hand',
   'Jewelry should be 100% match as per the shared image. Lifestyle shot of the ring worn on an elegant hand.',
   'Rings',
   'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400&h=400&fit=crop',
   'Lifestyle jewellery photography, ring worn on an elegant female hand with manicured nails, hand resting on soft fabric, warm natural light, shallow depth of field, focus on the ring, casual luxury feel, Instagram-ready, 4K',
   '4:5', 7),

  ('tpl_08', 'Luxury Gold Pendant Display',
   'Create a background for an advertisement of this jewellery, pendant on a premium display stand.',
   'Pendants',
   'https://images.unsplash.com/photo-1515562141589-67f0d569b3b4?w=400&h=400&fit=crop',
   'Premium pendant display photography, gold pendant hanging on a sleek black velvet display stand, dramatic side lighting highlighting metal texture, dark luxury background with subtle golden gradient, sharp focus, advertisement quality, 4K',
   '4:5', 8),

  ('tpl_09', 'Classic Black Velvet Showcase',
   'Timeless elegance — jewellery placed on rich black velvet with dramatic studio lighting.',
   'Rings',
   'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',
   'Classic jewellery photography, piece displayed on rich black velvet surface, dramatic spot lighting from above, deep shadows, jewellery glowing against the dark background, luxury brand advertisement, sharp macro detail, 4K',
   '1:1', 9),

  ('tpl_10', 'Rose Garden Vintage',
   'Romantic vintage aesthetic with dried roses and antique props.',
   'Earrings',
   'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=400&h=400&fit=crop',
   'Vintage romantic jewellery photography, earrings placed among dried pink and white roses, antique brass tray, soft warm natural light, shallow depth of field, nostalgic dreamy atmosphere, editorial style, 4K',
   '4:5', 10),

  ('tpl_11', 'Ocean Blue Luxury',
   'Jewellery on a serene ocean-blue silk surface with water-inspired elements.',
   'Bracelets',
   'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop',
   'Luxury jewellery photography, bracelet displayed on flowing ocean-blue silk fabric, water droplets scattered around, soft cool lighting with hints of turquoise, clean elegant composition, sharp focus on every link and stone, 4K',
   '3:2', 11),

  ('tpl_12', 'Minimalist White Studio',
   'Ultra-clean minimalist white background product shot, pure e-commerce style.',
   'Chains',
   'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop',
   'E-commerce product photography, jewellery on pure white seamless background, soft even studio lighting from all sides, no shadows, crisp sharp focus, clean isolation, Amazon/Shopify listing quality, 4K',
   '1:1', 12),

  ('tpl_13', 'Golden Hour Outdoor',
   'Warm golden hour natural light photography with outdoor bokeh.',
   'Necklaces',
   'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400&h=400&fit=crop',
   'Golden hour jewellery photography, necklace held up against warm sunset light, beautiful golden bokeh background, lens flare catching gemstones, warm amber tones, lifestyle luxury feel, editorial quality, 4K',
   '9:16', 13),

  ('tpl_14', 'Royal Purple Satin',
   'Regal purple satin backdrop with gold accents for a royal presentation.',
   'Pendants',
   'https://images.unsplash.com/photo-1600721391776-b5cd0e0048f9?w=400&h=400&fit=crop',
   'Royal jewellery photography, pendant on deep purple satin fabric with gold trim, dramatic lighting from above, rich warm tones, small golden crown prop in background, luxury regal atmosphere, sharp focus, 4K',
   '4:5', 14),

  ('tpl_15', 'Tropical Leaves Fresh',
   'Fresh tropical aesthetic with monstera leaves and natural textures.',
   'Bracelets',
   'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop',
   'Fresh tropical jewellery photography, bracelet placed on a smooth river stone, surrounded by lush green monstera leaves, soft natural daylight, water droplets on leaves, organic luxury feel, Instagram lifestyle aesthetic, 4K',
   '1:1', 15),

  ('tpl_16', 'Diamond Dust Sparkle',
   'Dramatic dark background with diamond dust particles and sparkle effects.',
   'Earrings',
   'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=400&h=400&fit=crop',
   'Dramatic jewellery photography, earrings floating against a dark background, diamond dust particles sparkling in the air, dramatic spot lighting, lens flare on gemstones, luxury brand campaign style, cinematic, 4K',
   '9:16', 16),

  ('tpl_17', 'Rustic Wood & Linen',
   'Organic rustic feel with natural wood and linen textures.',
   'Chains',
   'https://images.unsplash.com/photo-1576022162028-6f9631422d14?w=400&h=400&fit=crop',
   'Rustic jewellery photography, chain necklace draped on weathered wood surface with natural linen cloth, warm earthy tones, soft directional light, artisan handmade aesthetic, cozy lifestyle feel, 4K',
   '3:2', 17),

  ('tpl_18', 'Mirror Reflection Glamour',
   'Glamorous mirror surface creating a stunning reflection of the jewellery.',
   'Necklaces',
   'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop',
   'Glamour jewellery photography, necklace placed on a polished mirror surface, perfect reflection visible, soft studio lighting, chrome and glass elements in background, high-fashion luxury advertisement, sharp detail, 4K',
   '16:9', 18)

ON CONFLICT (id) DO NOTHING;
