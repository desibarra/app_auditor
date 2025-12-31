const fs = require('fs');
const path = require('path');
const content = fs.readFileSync('apps/backend/verificacion-output.txt', 'utf16le');
console.log(content);
