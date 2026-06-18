import fs from 'fs';
import glob from 'glob';

const files = glob.sync('components/**/*.tsx');
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('useGameStore()')) {
        console.log('--- ' + file + ' ---');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (line.includes('useGameStore()')) {
                console.log(line);
            }
        });
    }
});
