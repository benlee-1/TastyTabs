const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

// Create a 1024x1024 canvas
const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext("2d");

// Draw the icon
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, 1024, 1024);

// Draw the inner circle
ctx.beginPath();
ctx.arc(512, 512, 400, 0, Math.PI * 2);
ctx.fillStyle = "#0a7ea4";
ctx.fill();

// Add shadow
ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
ctx.shadowBlur = 20;
ctx.shadowOffsetY = 8;

// Draw the letter T
ctx.fillStyle = "#ffffff";
ctx.font = "bold 400px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("T", 512, 512);

// Save the icon
const outputDir = path.join(__dirname, "../assets/images");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save as PNG
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(path.join(outputDir, "icon.png"), buffer);
fs.writeFileSync(path.join(outputDir, "adaptive-icon.png"), buffer);
fs.writeFileSync(path.join(outputDir, "splash-icon.png"), buffer);

// Create a smaller version for favicon
const faviconCanvas = createCanvas(32, 32);
const faviconCtx = faviconCanvas.getContext("2d");

// Draw the icon at 32x32
faviconCtx.fillStyle = "#ffffff";
faviconCtx.fillRect(0, 0, 32, 32);

faviconCtx.beginPath();
faviconCtx.arc(16, 16, 12, 0, Math.PI * 2);
faviconCtx.fillStyle = "#0a7ea4";
faviconCtx.fill();

faviconCtx.fillStyle = "#ffffff";
faviconCtx.font = "bold 20px Arial";
faviconCtx.textAlign = "center";
faviconCtx.textBaseline = "middle";
faviconCtx.fillText("T", 16, 16);

// Save favicon
const faviconBuffer = faviconCanvas.toBuffer("image/png");
fs.writeFileSync(path.join(outputDir, "favicon.png"), faviconBuffer);

console.log("App icons generated successfully!");
