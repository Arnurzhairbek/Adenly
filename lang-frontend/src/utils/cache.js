// Простая система кэширования для API запросов

const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 минут по умолчанию

/**
 * Получить данные из кэша
 */
export function getCached(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  // Проверяем, не истек ли кэш
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Деректерді кэшке сақтау
 */
export function setCache(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Кэштен жою
 */
export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Инвалидировать кэш по паттерну
 */
export function invalidateCache(pattern) {
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Получить все ключи кэша
 */
export function getCacheKeys() {
  return Array.from(cache.keys());
}

