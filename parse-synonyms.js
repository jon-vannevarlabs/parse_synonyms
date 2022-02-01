const fs = require('fs');
const parse = require('csv-parse').parse;

const synonyms = []
const twoWayMappings = {};
const oneWayMappings = {};

const [_, _, inputFile, outputFile] = process.argv;

fs.createReadStream(inputFile)
    .pipe(parse())
    .on('data', (data) => {
        const [Lhs, Rhs, Relation] = data
        if (!Lhs || !Rhs) {
            console.log('Throwing away for no lhs/rhs: ', Lhs, Rhs, Relation)
            return;
        }
        
        const lhs = Lhs.toLowerCase();
        const rhs = Rhs.toLowerCase();
        const relation = parseInt(Relation);

        if (relation === 2) {
            if (!twoWayMappings[lhs]) {
                twoWayMappings[lhs] = new Set();
            }
            twoWayMappings[lhs].add(lhs)
            twoWayMappings[lhs].add(rhs)

            // ADA systems.
            if (lhs.match(/^sa?-\d+[a-z]$/)) {
                twoWayMappings[lhs].add(`${lhs} missile`)
                twoWayMappings[lhs].add(`${lhs} air defense`)
            }

            // Aircraft.
            if (lhs.match(/^(j|h|f|b|c)-\d+[a-z]$/)) {
                twoWayMappings[lhs].add(`${lhs} aircraft`)
            }
        } else if (relation === 1) {
            if (!oneWayMappings[lhs]) {
                oneWayMappings[lhs] = new Set();
            }
            oneWayMappings[lhs].add(rhs)
        } else {
            if (Relation !== 'Key') {
                console.log('Throwing away for no relation: ', Lhs, Rhs, Relation)
            }
        }
    })
    .on('end', () => {
        console.log(twoWayMappings)
        console.log(oneWayMappings)
        const twoWaySets = Object.values(twoWayMappings)
        for (const val of twoWaySets) {
            synonyms.push(Array.from(val).join(','))
        }
        const oneWaySets = Object.entries(oneWayMappings)
        for (const [key, val] of oneWaySets) {
            synonyms.push(`${key} => ${Array.from(val).join(',')}`);
        }
        fs.writeFile(outputFile, synonyms.join('\n'), (err) => {
            if (err) {
                console.error(err)
            }
            console.log('Done writing')
        })
    });