const SIZES = {
  card: 'w=600&q=70&auto=format',
  hero: 'w=1200&q=72&auto=format',
  thumb: 'w=240&q=65&auto=format',
}

const EMOJI_BY_CATEGORY = {
  classic: '🥟',
  special: '🌟',
  sweet: '🧁',
  drinks: '🥤',
  packs: '🎉',
}

export function sizedImage(url, size = 'card') {
  if (!url) return null
  const param = SIZES[size] ?? SIZES.card
  if (url.includes('images.unsplash.com') || url.includes('images.pexels.com')) {
    const base = url.split('?')[0]
    return `${base}?${param}`
  }
  return url
}

export function productImage(product, size = 'card') {
  return sizedImage(product?.image_url, size)
}

export function storeImage(store, size = 'hero') {
  return sizedImage(store?.image_url, size)
}

export function productEmoji(product) {
  if (product?.emoji) return product.emoji
  const cat = product?.category?.slug
  return EMOJI_BY_CATEGORY[cat] ?? '🥟'
}

export function storeEmoji(store) {
  return store?.hero_emoji ?? '🥟'
}
