const fs = require('fs');

const path = 'menu.html';
let content = fs.readFileSync(path, 'utf8');

// The backslashes were incorrectly added before backticks and dollar signs inside the script tag.
// We need to replace \` with ` and \$ with $ inside the menu.html file.

// We will only replace \` that are at the beginning of the return statement or end of it, 
// and \$ inside the template literal.
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed escaping in menu.html");
