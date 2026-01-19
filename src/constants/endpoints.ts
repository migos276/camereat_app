export const ENDPOINTS = {
  // Auth (without leading slash to avoid double slashes with baseURL)
  AUTH_LOGIN: "auth/login/",
  AUTH_LOGOUT: "auth/logout/",
  AUTH_REGISTER: "auth/register/",
  AUTH_REFRESH: "auth/refresh/",
  AUTH_PASSWORD_RESET: "auth/password-reset/",
  AUTH_PASSWORD_CONFIRM: "auth/password-confirm/",

  // Users (under api/auth/ based on config/urls.py)
  USERS_PROFILE: "auth/me/",
  USERS_UPDATE_PROFILE: "auth/me/",
  USERS_CHANGE_PASSWORD: "auth/password/",
  USERS_UPLOAD_DOCUMENT: "auth/documents/",
  USERS_UPLOAD_PHOTO: "auth/upload-photo/",
  USERS_ADDRESSES: "auth/addresses/",
  USERS_ADDRESS_CREATE: "auth/addresses/",
  USERS_ADDRESS_UPDATE: (id: string) => `auth/addresses/${id}/`,
  USERS_ADDRESS_DELETE: (id: string) => `auth/addresses/${id}/`,

  // Verification (under api/verification/)
  VERIFICATION_SUBMIT: "verification/submit/",
  VERIFICATION_LIST: "verification/",
  VERIFICATION_DETAIL: (id: string) => `verification/${id}/`,
  VERIFICATION_APPROVE: (id: string) => `verification/${id}/approve/`,
  VERIFICATION_REJECT: (id: string) => `verification/${id}/reject/`,

  // Restaurants (under api/restaurants/)
  RESTAURANTS_LIST: "restaurants/",
  RESTAURANTS_DETAIL: (id: string) => `restaurants/${id}/`,
  RESTAURANTS_NEARBY: "restaurants/nearby/",
  RESTAURANTS_MENU: (id: string) => `restaurants/${id}/menu/`,
  RESTAURANTS_PRODUCTS: (id: string) => `restaurants/${id}/products/`,
  RESTAURANTS_RATINGS: (id: string) => `restaurants/${id}/ratings/`,
  RESTAURANTS_DASHBOARD_STATS: "restaurants/dashboard_stats/",
  RESTAURANTS_RECENT_ORDERS: "restaurants/recent_orders/",
  RESTAURANTS_ORDERS: "restaurants/orders/",
  RESTAURANTS_MY_RESTAURANT: "restaurants/my_restaurant/",
  RESTAURANTS_UPDATE_PROFILE: "restaurants/update_profile/",
  RESTAURANTS_REGISTER_PROFILE: "restaurants/register-profile/",
  RESTAURANTS_UPLOAD_LOGO: "restaurants/upload_logo/",
  RESTAURANTS_UPLOAD_COVER: "restaurants/upload_cover_image/",

  // Supermarkets (under api/supermarches/)
  SUPERMARKETS_LIST: "supermarkets/",
  SUPERMARKETS_DETAIL: (id: string) => `supermarkets/${id}/`,
  SUPERMARKETS_NEARBY: "supermarkets/nearby/",
  SUPERMARKETS_PRODUCTS: (id: string) => `supermarkets/${id}/products/`,
  SUPERMARKETS_RATINGS: (id: string) => `supermarkets/${id}/ratings/`,

  // Products (under api/products/)
  PRODUCTS_LIST: "products/",
  PRODUCTS_DETAIL: (id: string) => `products/${id}/`,
  PRODUCTS_SEARCH: "products/search/",

  // Search (under api/)
  RESTAURANTS_SEARCH: "restaurants/search/",
  MENU_SEARCH: "menu/search/",

  // Orders (under api/orders/)
  ORDERS_LIST: "orders/",
  ORDERS_CREATE: "orders/",
  ORDERS_DETAIL: (id: string) => `orders/${id}/`,
  ORDERS_CANCEL: (id: string) => `orders/${id}/cancel/`,
  ORDERS_TRACK: (id: string) => `orders/${id}/track/`,
  ORDERS_VALIDATE_OTP: (id: string) => `orders/${id}/validate-otp/`,
  ORDERS_RATE: (id: string) => `orders/${id}/rate/`,

  // Livreurs (under api/livreurs/)
  LIVREURS_PROFILE: "livreurs/me/",
  LIVREURS_UPDATE_PROFILE: "livreurs/update_profile/",
  LIVREURS_NEARBY_DELIVERIES: "livreurs/commandes_disponibles/",
  LIVREURS_AVAILABLE_DELIVERIES: "livreurs/commandes_disponibles/",
  LIVREURS_ACCEPT_DELIVERY: (id: string) => `livreurs/accepter_commande/`,
  LIVREURS_REJECT_DELIVERY: (id: string) => `livreurs/rejeter_commande/`,
  LIVREURS_UPDATE_POSITION: "livreurs/update_position/",
  LIVREURS_UPDATE_STATUS: "livreurs/update_status/",
  LIVREURS_DELIVERY_STATUS: (id: string) => `livreurs/update_status/`,
  LIVREURS_STATS: "livreurs/statistiques/",
  LIVREURS_EARNINGS: "livreurs/revenus/",

  // Deliveries (under api/deliveries/)
  DELIVERIES_LIST: "deliveries/",
  DELIVERIES_DETAIL: (id: string) => `deliveries/${id}/`,
  DELIVERIES_UPDATE_STATUS: (id: string) => `deliveries/${id}/status/`,

  // Notifications (under api/notifications/)
  NOTIFICATIONS_LIST: "notifications/",
  NOTIFICATIONS_MARK_READ: (id: string) => `notifications/${id}/mark-read/`,
  NOTIFICATIONS_MARK_ALL_READ: "notifications/mark-all-read/",

  // Zones (under api/zones/)
  ZONES_LIST: "zones/",
  ZONES_NEARBY: "zones/nearby/",

  // Geolocation (under api/geo/)
  GEOLOCATION_GEOCODE: "geolocation/geocode/",
  GEOLOCATION_REVERSE_GEOCODE: "geolocation/reverse-geocode/",
}

