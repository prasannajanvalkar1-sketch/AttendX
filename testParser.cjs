const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');

async function testPdf() {
  const data = new Uint8Array(fs.readFileSync('C:\\Users\\Prasanna\\Downloads\\sheet.PDF'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  
  let allItems = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if (item.str.trim() === '') continue;
      allItems.push({
        text: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5],
        width: item.width
      });
    }
  }

  // Sort by Y (descending) and then X
  allItems.sort((a, b) => {
    if (Math.abs(b.y - a.y) > 3) return b.y - a.y;
    return a.x - b.x;
  });

  for (const item of allItems) {
    console.log(`TEXT: [${item.text}] X: ${item.x.toFixed(2)} Y: ${item.y.toFixed(2)} W: ${item.width.toFixed(2)}`);
  }
}

testPdf().catch(console.error);
