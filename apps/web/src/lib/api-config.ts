/** Server tomonidan FastAPI'ga murojaat uchun asosiy manzil.
 *  Docker'da: http://api:8000 · lokal dev'da: http://localhost:8001 */
export const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:8001';

export const COOKIE_ACCESS = 'imkon_at';
export const COOKIE_REFRESH = 'imkon_rt';

export const ACCESS_MAX_AGE = 15 * 60; // 15 daqiqa
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 kun

export const isProd = process.env.NODE_ENV === 'production';
