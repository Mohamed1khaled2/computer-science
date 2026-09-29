// بيولّد PNGs من اللوجو (Android مش بيعرض SVG في الإشعارات، وiOS محتاج PNG للأيقونة).
// التشغيل: node scripts/make-icons.mjs
import sharp from "sharp";

const out = [
  ["logo.svg", "icon-192.png", 192],
  ["logo.svg", "icon-512.png", 512],
  ["maskable.svg", "maskable-512.png", 512],
  ["maskable.svg", "apple-touch-icon.png", 180], // iOS بيقص الأركان لوحده
  ["badge.svg", "badge-96.png", 96], // أيقونة شريط الحالة في Android: أبيض على شفاف
];

for (const [src, dest, size] of out) {
  await sharp(`public/icons/${src}`, { density: 384 }).resize(size, size).png().toFile(`public/icons/${dest}`);
  console.log(dest, size);
}
