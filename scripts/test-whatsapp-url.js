const fs = require("fs");
const path = require("path");

const dir = path.join(
  process.cwd(),
  "public",
  "assets",
  "collections",
  "outfits",
);
const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => /outfit(\d+)\.jpeg$/.test(f))
  : [];
if (files.length === 0) {
  console.error("No outfit images found in", dir);
  process.exit(1);
}

const sorted = files.sort((a, b) => {
  const ai = parseInt((a.match(/outfit(\d+)\.jpeg/) || [])[1], 10);
  const bi = parseInt((b.match(/outfit(\d+)\.jpeg/) || [])[1], 10);
  return ai - bi;
});
const first = sorted[0];
const phone = (
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS || "22967280018"
).trim();
const origin = "https://perscadors.vercel.app";
const message = `Bonjour 👋\n\nJe souhaite recréer ce look : ${first}\n\n${origin}/assets/collections/outfits/${first}\n\nMerci !`;
const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

console.log("Found outfit file:", first);
console.log("Phone:", phone);
console.log("Message:\n", message);
console.log("\nWhatsApp URL:");
console.log(url);
