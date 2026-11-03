/**
 * Vietnamese birthplaces for true-solar-time correction.
 *
 * The 63 provinces / centrally-run cities as they existed before the 2025-07-01 merger
 * (the names people find on birth certificates). Longitude is that of the provincial
 * capital, in degrees East; correction = (longitude − 105°) × 4 minutes against UTC+7.
 * Vietnam spans ~102°–109.5°E, so the correction ranges from about −10 to +18 minutes.
 */
export interface VnProvince {
  name: string;
  longitude: number;
}

export const VN_PROVINCES: VnProvince[] = [
  { name: 'An Giang', longitude: 105.44 },
  { name: 'Bà Rịa – Vũng Tàu', longitude: 107.17 },
  { name: 'Bạc Liêu', longitude: 105.72 },
  { name: 'Bắc Giang', longitude: 106.19 },
  { name: 'Bắc Kạn', longitude: 105.83 },
  { name: 'Bắc Ninh', longitude: 106.07 },
  { name: 'Bến Tre', longitude: 106.38 },
  { name: 'Bình Dương', longitude: 106.65 },
  { name: 'Bình Định', longitude: 109.22 },
  { name: 'Bình Phước', longitude: 106.90 },
  { name: 'Bình Thuận', longitude: 108.10 },
  { name: 'Cà Mau', longitude: 105.15 },
  { name: 'Cao Bằng', longitude: 106.25 },
  { name: 'Cần Thơ', longitude: 105.78 },
  { name: 'Đà Nẵng', longitude: 108.22 },
  { name: 'Đắk Lắk', longitude: 108.04 },
  { name: 'Đắk Nông', longitude: 107.69 },
  { name: 'Điện Biên', longitude: 103.02 },
  { name: 'Đồng Nai', longitude: 106.82 },
  { name: 'Đồng Tháp', longitude: 105.63 },
  { name: 'Gia Lai', longitude: 108.00 },
  { name: 'Hà Giang', longitude: 104.98 },
  { name: 'Hà Nam', longitude: 105.92 },
  { name: 'Hà Nội', longitude: 105.85 },
  { name: 'Hà Tĩnh', longitude: 105.90 },
  { name: 'Hải Dương', longitude: 106.33 },
  { name: 'Hải Phòng', longitude: 106.68 },
  { name: 'Hậu Giang', longitude: 105.47 },
  { name: 'Hòa Bình', longitude: 105.34 },
  { name: 'Hưng Yên', longitude: 106.05 },
  { name: 'Khánh Hòa', longitude: 109.19 },
  { name: 'Kiên Giang', longitude: 105.08 },
  { name: 'Kon Tum', longitude: 108.00 },
  { name: 'Lai Châu', longitude: 103.46 },
  { name: 'Lâm Đồng', longitude: 108.44 },
  { name: 'Lạng Sơn', longitude: 106.76 },
  { name: 'Lào Cai', longitude: 103.97 },
  { name: 'Long An', longitude: 106.41 },
  { name: 'Nam Định', longitude: 106.17 },
  { name: 'Nghệ An', longitude: 105.69 },
  { name: 'Ninh Bình', longitude: 105.97 },
  { name: 'Ninh Thuận', longitude: 108.99 },
  { name: 'Phú Thọ', longitude: 105.43 },
  { name: 'Phú Yên', longitude: 109.32 },
  { name: 'Quảng Bình', longitude: 106.60 },
  { name: 'Quảng Nam', longitude: 108.47 },
  { name: 'Quảng Ngãi', longitude: 108.80 },
  { name: 'Quảng Ninh', longitude: 107.08 },
  { name: 'Quảng Trị', longitude: 107.10 },
  { name: 'Sóc Trăng', longitude: 105.97 },
  { name: 'Sơn La', longitude: 103.91 },
  { name: 'Tây Ninh', longitude: 106.10 },
  { name: 'Thái Bình', longitude: 106.34 },
  { name: 'Thái Nguyên', longitude: 105.84 },
  { name: 'Thanh Hóa', longitude: 105.78 },
  { name: 'Thừa Thiên Huế', longitude: 107.59 },
  { name: 'Tiền Giang', longitude: 106.36 },
  { name: 'TP. Hồ Chí Minh', longitude: 106.70 },
  { name: 'Trà Vinh', longitude: 106.34 },
  { name: 'Tuyên Quang', longitude: 105.21 },
  { name: 'Vĩnh Long', longitude: 105.97 },
  { name: 'Vĩnh Phúc', longitude: 105.60 },
  { name: 'Yên Bái', longitude: 104.87 },
];
