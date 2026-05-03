export interface Template {
  id: string
  title: string
  description: string
  category: TemplateCategory
  thumbnail: string
  prompt: string
  defaultAspectRatio: AspectRatio
}

export type TemplateCategory = 'All' | 'Necklaces' | 'Earrings' | 'Rings' | 'Bracelets' | 'Pendants' | 'Chains'

export type AspectRatio = '1:1' | '4:5' | '3:2' | '16:9' | '9:16'

export const CATEGORIES: TemplateCategory[] = [
  'All', 'Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Pendants', 'Chains',
]

export const TEMPLATES: Template[] = [
  {
    id: 'tpl_01',
    title: 'Elegant Pastel Blue Tabletop',
    description: 'Jewelry should be 100% match as per the shared image. A bright, airy tabletop setting with soft pastel blue velvet backdrop and natural window light.',
    category: 'Necklaces',
    thumbnail: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
    prompt: 'Professional jewellery product photography, elegant pastel blue velvet backdrop, soft natural window light from the left, jewellery placed on a delicate glass display stand, clean minimal composition, sharp focus on jewellery details, the jewellery surface must be completely clean and unobstructed with no fabric dust or particles on it, luxury catalogue shot, 4K, photorealistic',
    defaultAspectRatio: '1:1',
  },
  {
    id: 'tpl_02',
    title: 'Luxurious Maroon & Gold',
    description: 'Create a premium jewellery tabletop photoshoot in a rich, luxurious maroon and gold setting with silk drapes.',
    category: 'Necklaces',
    thumbnail: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
    prompt: 'Premium jewellery photography, rich maroon silk cloth with gold zari border, warm golden lighting, jewellery displayed elegantly on the fabric, subtle smoke effect only in the far background never touching the jewellery, temple-inspired golden miniature in backdrop, the jewellery surface must be completely clean pristine and fully visible with no smoke or particles on it, sharp focus on jewellery, luxury Indian aesthetic, 4K',
    defaultAspectRatio: '4:5',
  },
  {
    id: 'tpl_03',
    title: 'High-Fashion Indian Bridal',
    description: 'Create a high-fashion Indian bridal photoshoot featuring a model wearing the jewellery in an editorial setting.',
    category: 'Necklaces',
    thumbnail: 'https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=400&h=400&fit=crop',
    prompt: 'High-fashion Indian bridal editorial, beautiful Indian model wearing the jewellery, rich red and gold lehenga, dramatic studio lighting, luxury wedding magazine cover style, bokeh background with warm golden tones, the jewellery must be fully visible and unobstructed with every detail clearly shown, 4K, photorealistic',
    defaultAspectRatio: '4:5',
  },
  {
    id: 'tpl_04',
    title: 'Emerald Ring Frozen Ice',
    description: 'Cinematic close-up of the jewellery on a frozen ice crystal surface with cool blue lighting.',
    category: 'Rings',
    thumbnail: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
    prompt: 'Cinematic jewellery photography, ring placed on a frozen ice crystal surface, cool blue and white lighting, ice crystals and frost ONLY in the background and surrounding area NEVER on the jewellery itself, the ring surface must be completely clean dry and pristine with every gemstone and metal detail fully visible, dramatic macro close-up, sharp focus on gemstones, luxury advertisement style, 4K',
    defaultAspectRatio: '1:1',
  },
  {
    id: 'tpl_05',
    title: 'Elegant Silver on Marble',
    description: 'Jewelry should be 100% match as per the shared image. High-end silver earrings displayed on a white marble surface.',
    category: 'Earrings',
    thumbnail: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
    prompt: 'Luxury jewellery product photography, earrings elegantly placed on polished white marble surface with grey veins, soft diffused studio lighting, minimal clean background, small green eucalyptus leaves placed away from the jewellery as accent only, the jewellery must be completely clean and unobstructed, sharp focus, catalogue quality, 4K',
    defaultAspectRatio: '1:1',
  },
  {
    id: 'tpl_06',
    title: 'Luxurious Engagement Ring',
    description: 'Jewelry should be 100% match as per the shared image. A breathtaking close-up on a satin pillow.',
    category: 'Rings',
    thumbnail: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',
    prompt: 'Luxury engagement ring photography, ring placed on a soft ivory satin pillow, warm romantic lighting, bokeh background with rose petals scattered only around the pillow not on the ring, the ring must be completely clean and pristine with every diamond facet clearly visible, extreme macro detail, dreamy soft glow, wedding advertisement quality, 4K',
    defaultAspectRatio: '3:2',
  },
  {
    id: 'tpl_07',
    title: 'Crossover Ring on Hand',
    description: 'Jewelry should be 100% match as per the shared image. Lifestyle shot of the ring worn on an elegant hand.',
    category: 'Rings',
    thumbnail: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400&h=400&fit=crop',
    prompt: 'Lifestyle jewellery photography, ring worn on an elegant female hand with manicured nails, hand resting on soft fabric, warm natural light, shallow depth of field, the ring must be fully visible with every design detail clearly shown and unobstructed, focus on the ring, casual luxury feel, Instagram-ready, 4K',
    defaultAspectRatio: '4:5',
  },
  {
    id: 'tpl_08',
    title: 'Luxury Gold Pendant Display',
    description: 'Create a background for an advertisement of this jewellery, pendant on a premium display stand.',
    category: 'Pendants',
    thumbnail: 'https://images.unsplash.com/photo-1515562141589-67f0d569b3b4?w=400&h=400&fit=crop',
    prompt: 'Premium pendant display photography, gold pendant hanging on a sleek black velvet display stand, dramatic side lighting highlighting metal texture, dark luxury background with subtle golden gradient, the pendant must be completely clean and unobstructed with every detail fully visible, sharp focus, advertisement quality, 4K',
    defaultAspectRatio: '4:5',
  },
  {
    id: 'tpl_09',
    title: 'Classic Black Velvet Showcase',
    description: 'Timeless elegance — jewellery placed on rich black velvet with dramatic studio lighting.',
    category: 'Rings',
    thumbnail: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',
    prompt: 'Classic jewellery photography, piece displayed on rich black velvet surface, dramatic spot lighting from above, deep shadows only around the jewellery not on it, the jewellery surface must be pristine clean and fully visible, jewellery glowing against the dark background, luxury brand advertisement, sharp macro detail, 4K',
    defaultAspectRatio: '1:1',
  },
  {
    id: 'tpl_10',
    title: 'Rose Garden Vintage',
    description: 'Romantic vintage aesthetic with dried roses and antique props.',
    category: 'Earrings',
    thumbnail: 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=400&h=400&fit=crop',
    prompt: 'Vintage romantic jewellery photography, earrings placed among dried pink and white roses but roses must not touch or overlap the earrings, antique brass tray, soft warm natural light, the earrings must be completely visible and unobstructed with no petals or debris on them, shallow depth of field, nostalgic dreamy atmosphere, editorial style, 4K',
    defaultAspectRatio: '4:5',
  },
  {
    id: 'tpl_11',
    title: 'Ocean Blue Luxury',
    description: 'Jewellery on a serene ocean-blue silk surface with water-inspired elements.',
    category: 'Bracelets',
    thumbnail: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop',
    prompt: 'Luxury jewellery photography, bracelet displayed on flowing ocean-blue silk fabric, water droplets scattered only around the fabric NEVER on the jewellery itself, the bracelet must be completely dry clean and pristine with every link and stone fully visible, soft cool lighting with hints of turquoise, clean elegant composition, sharp focus, 4K',
    defaultAspectRatio: '3:2',
  },
  {
    id: 'tpl_12',
    title: 'Minimalist White Studio',
    description: 'Ultra-clean minimalist white background product shot, pure e-commerce style.',
    category: 'Chains',
    thumbnail: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop',
    prompt: 'E-commerce product photography, jewellery on pure white seamless background, soft even studio lighting from all sides, no shadows, the jewellery must be perfectly clean and fully visible with every detail shown, crisp sharp focus, clean isolation, Amazon/Shopify listing quality, 4K',
    defaultAspectRatio: '1:1',
  },
  {
    id: 'tpl_13',
    title: 'Golden Hour Outdoor',
    description: 'Warm golden hour natural light photography with outdoor bokeh.',
    category: 'Necklaces',
    thumbnail: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400&h=400&fit=crop',
    prompt: 'Golden hour jewellery photography, necklace held up against warm sunset light, beautiful golden bokeh background, subtle lens flare in background only not obscuring the jewellery, the necklace must be fully visible with every gemstone and chain link clearly shown, warm amber tones, lifestyle luxury feel, editorial quality, 4K',
    defaultAspectRatio: '9:16',
  },
  {
    id: 'tpl_14',
    title: 'Royal Purple Satin',
    description: 'Regal purple satin backdrop with gold accents for a royal presentation.',
    category: 'Pendants',
    thumbnail: 'https://images.unsplash.com/photo-1600721391776-b5cd0e0048f9?w=400&h=400&fit=crop',
    prompt: 'Royal jewellery photography, pendant on deep purple satin fabric with gold trim, dramatic lighting from above, rich warm tones, small golden crown prop placed in the far background not near the jewellery, the pendant must be completely clean and unobstructed with every detail fully visible, luxury regal atmosphere, sharp focus, 4K',
    defaultAspectRatio: '4:5',
  },
  {
    id: 'tpl_15',
    title: 'Tropical Leaves Fresh',
    description: 'Fresh tropical aesthetic with monstera leaves and natural textures.',
    category: 'Bracelets',
    thumbnail: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop',
    prompt: 'Fresh tropical jewellery photography, bracelet placed on a smooth river stone, surrounded by lush green monstera leaves that do not touch or overlap the jewellery, soft natural daylight, water droplets only on the leaves NEVER on the bracelet, the bracelet must be completely dry clean and pristine with every detail visible, organic luxury feel, Instagram lifestyle aesthetic, 4K',
    defaultAspectRatio: '1:1',
  },
  {
    id: 'tpl_16',
    title: 'Diamond Dust Sparkle',
    description: 'Dramatic dark background with diamond dust particles and sparkle effects.',
    category: 'Earrings',
    thumbnail: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=400&h=400&fit=crop',
    prompt: 'Dramatic jewellery photography, earrings floating against a dark background, diamond dust particles sparkling only in the far background NEVER on the jewellery surface, the earrings must be completely clean and pristine with every gemstone fully visible, dramatic spot lighting, subtle lens flare, luxury brand campaign style, cinematic, 4K',
    defaultAspectRatio: '9:16',
  },
  {
    id: 'tpl_17',
    title: 'Rustic Wood & Linen',
    description: 'Organic rustic feel with natural wood and linen textures.',
    category: 'Chains',
    thumbnail: 'https://images.unsplash.com/photo-1576022162028-6f9631422d14?w=400&h=400&fit=crop',
    prompt: 'Rustic jewellery photography, chain necklace draped on weathered wood surface with natural linen cloth nearby but not covering the chain, warm earthy tones, soft directional light, the chain must be completely visible with every link clearly shown and no dust or debris on it, artisan handmade aesthetic, cozy lifestyle feel, 4K',
    defaultAspectRatio: '3:2',
  },
  {
    id: 'tpl_18',
    title: 'Mirror Reflection Glamour',
    description: 'Glamorous mirror surface creating a stunning reflection of the jewellery.',
    category: 'Necklaces',
    thumbnail: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop',
    prompt: 'Glamour jewellery photography, necklace placed on a polished mirror surface, perfect reflection visible, soft studio lighting, chrome and glass elements only in the far background, the necklace must be completely clean and pristine with every gemstone chain and design detail fully visible and unobstructed, high-fashion luxury advertisement, sharp detail, 4K',
    defaultAspectRatio: '16:9',
  },
]
