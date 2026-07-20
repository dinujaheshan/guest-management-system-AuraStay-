const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if(!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else { 
            if(file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'app')).concat(walk(path.join(__dirname, 'lib'))).concat(walk(path.join(__dirname, 'modules'))).concat(walk(path.join(__dirname, 'components')));

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const searchString = '"@/app/api/auth/[...nextauth]/route"';
    const replaceString = '"@/lib/auth"';
    
    if (content.includes(searchString)) {
        content = content.split(searchString).join(replaceString);
        fs.writeFileSync(file, content, 'utf8');
        count++;
    }
});

console.log(`Updated ${count} files.`);
