// Thailand's 77 provinces with each provincial capital's coordinates, to name the province
// a visitor is in from their browser's location. [name, latitude, longitude]
const PROVINCES = [
  ['Bangkok', 13.75, 100.5],
  ['Samut Prakan', 13.6, 100.6],
  ['Nonthaburi', 13.86, 100.51],
  ['Pathum Thani', 14.02, 100.53],
  ['Ayutthaya', 14.35, 100.57],
  ['Ang Thong', 14.59, 100.45],
  ['Lopburi', 14.8, 100.65],
  ['Sing Buri', 14.89, 100.4],
  ['Chai Nat', 15.19, 100.13],
  ['Saraburi', 14.53, 100.91],
  ['Nakhon Nayok', 14.2, 101.21],
  ['Nakhon Pathom', 13.82, 100.06],
  ['Suphan Buri', 14.47, 100.12],
  ['Samut Sakhon', 13.55, 100.27],
  ['Samut Songkhram', 13.41, 100.0],
  ['Chonburi', 13.36, 100.98],
  ['Rayong', 12.68, 101.28],
  ['Chanthaburi', 12.61, 102.1],
  ['Trat', 12.24, 102.52],
  ['Chachoengsao', 13.69, 101.07],
  ['Prachinburi', 14.05, 101.37],
  ['Sa Kaeo', 13.82, 102.07],
  ['Kanchanaburi', 14.0, 99.55],
  ['Ratchaburi', 13.54, 99.82],
  ['Phetchaburi', 13.11, 99.94],
  ['Prachuap Khiri Khan', 11.81, 99.8],
  ['Tak', 16.87, 99.13],
  ['Chiang Mai', 18.79, 98.98],
  ['Chiang Rai', 19.91, 99.83],
  ['Lampang', 18.29, 99.49],
  ['Lamphun', 18.58, 99.01],
  ['Mae Hong Son', 19.3, 97.97],
  ['Nan', 18.78, 100.78],
  ['Phayao', 19.17, 99.9],
  ['Phrae', 18.14, 100.14],
  ['Uttaradit', 17.62, 100.1],
  ['Sukhothai', 17.01, 99.82],
  ['Phitsanulok', 16.82, 100.26],
  ['Phichit', 16.44, 100.35],
  ['Phetchabun', 16.42, 101.16],
  ['Kamphaeng Phet', 16.48, 99.52],
  ['Nakhon Sawan', 15.7, 100.14],
  ['Uthai Thani', 15.38, 100.02],
  ['Nakhon Ratchasima', 14.97, 102.1],
  ['Buriram', 14.99, 103.1],
  ['Surin', 14.88, 103.49],
  ['Sisaket', 15.12, 104.32],
  ['Ubon Ratchathani', 15.24, 104.85],
  ['Yasothon', 15.79, 104.15],
  ['Amnat Charoen', 15.86, 104.63],
  ['Chaiyaphum', 15.81, 102.03],
  ['Khon Kaen', 16.43, 102.83],
  ['Maha Sarakham', 16.18, 103.3],
  ['Roi Et', 16.05, 103.65],
  ['Kalasin', 16.43, 103.51],
  ['Mukdahan', 16.54, 104.72],
  ['Nakhon Phanom', 17.39, 104.78],
  ['Sakon Nakhon', 17.16, 104.15],
  ['Udon Thani', 17.41, 102.79],
  ['Nong Khai', 17.88, 102.74],
  ['Bueng Kan', 18.36, 103.65],
  ['Nong Bua Lamphu', 17.2, 102.44],
  ['Loei', 17.49, 101.72],
  ['Chumphon', 10.49, 99.18],
  ['Ranong', 9.96, 98.64],
  ['Surat Thani', 9.14, 99.33],
  ['Phang Nga', 8.45, 98.53],
  ['Phuket', 7.88, 98.39],
  ['Krabi', 8.09, 98.91],
  ['Nakhon Si Thammarat', 8.43, 99.96],
  ['Trang', 7.56, 99.61],
  ['Phatthalung', 7.62, 100.08],
  ['Satun', 6.62, 100.07],
  ['Songkhla', 7.19, 100.6],
  ['Pattani', 6.87, 101.25],
  ['Yala', 6.54, 101.28],
  ['Narathiwat', 6.43, 101.82],
];

// Farther than this from every provincial capital counts as outside Thailand
const MAX_KM = 150;

function distanceKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const radians = Math.PI / 180;
  const a =
    Math.sin(((latitudeB - latitudeA) * radians) / 2) ** 2 +
    Math.cos(latitudeA * radians) * Math.cos(latitudeB * radians) * Math.sin(((longitudeB - longitudeA) * radians) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

// The province whose capital is closest to this spot (a close guess near borders), or null outside Thailand
export function nearestProvince(latitude, longitude) {
  let best = null;
  let bestKm = MAX_KM;
  for (const [name, capitalLatitude, capitalLongitude] of PROVINCES) {
    const km = distanceKm(latitude, longitude, capitalLatitude, capitalLongitude);
    if (km < bestKm) [best, bestKm] = [name, km];
  }
  return best;
}
