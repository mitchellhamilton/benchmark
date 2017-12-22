/* Results on node 7.10.0, Fedora 25, Intel Core i7-6500U, 8 GB RAM and SSD:

Stylis:       15 ms   (3.5 times faster)
Autoprefixer: 53 ms
nib:          282 ms  (5.4 times slower)
Stylecow:     291 ms  (5.5 times slower)
Compass:      3315 ms (63.1 times slower)
*/

const exec = require('child_process').exec;
const path = require('path');
const fs   = require('fs');

const example = path.join(__dirname, 'cache', 'bootstrap.css');
const origin  = fs.readFileSync(example).toString();

// Autoprefixer
const autoprefixer = require('autoprefixer');
const postcss      = require('postcss');

const css = postcss([ autoprefixer({ browsers: [] }) ]).process(origin).css;
const processor = postcss([ autoprefixer ]);

// Stylecow
const stylecow    = require('stylecow-core');
const stylecowOut = new stylecow.Coder();
const stylecower  = new stylecow.Tasks();
stylecower.use(require('stylecow-plugin-prefixes'));

// nib
const stylus = require('stylus');
const styl = '@import \'nib\';\n' + css
    .replace('@charset "UTF-8";', '')
    .replace(/\}/g, '}\n').replace(/(\w)\[[^\]]+\]/g, '$1')
    .replace(/filter:[^;}]+;?/ig, '')
    .replace(/(@keyframes[^\{]+)\{/ig, '$1 {')
    .replace(/url\([^\)]+\)/ig, 'white');

// Compass
const scss = '@import \'compass/css3\';\n' + css
    .replace(/([^-])transform:([^;}]+)(;|})/g, '$1@include transform($2)$3')
    .replace(/transition:([^;}]+)(;|})/g, '@include transition($1)$2')
    .replace(
        /background(-image)?:((linear|radial)([^;}]+))(;|})/g,
        '@include background($2)$5'
    )
    .replace(/box-sizing:([^;}]+)(;|})/g, '@include box-sizing($1)$2');
const scssFile = path.join(__dirname, 'cache/bootstrap.prefixers.scss');
fs.writeFileSync(scssFile, scss);

// Stylis
const Stylis     = require('stylis/stylis.min.js');
const StylisClosure = require('emotion-utils').Stylis;
const stylis     = new Stylis();
const stylisClosure = new StylisClosure();

module.exports = {
    name: 'Bootstrap',
    maxTime: 15,
    tests: [
        // {
        //     name: 'Autoprefixer',
        //     defer: true,
        //     fn: done => {
        //         processor.process(css, { map: false }).then(() => {
        //             done.resolve();
        //         });
        //     }
        // },
        // {
        //     name: 'Stylecow',
        //     defer: true,
        //     fn: done => {
        //         const code = stylecow.parse(css);
        //         stylecower.run(code);
        //         stylecowOut.run(code);
        //         done.resolve();
        //     }
        // },
        // {
        //     name: 'nib',
        //     defer: true,
        //     fn: done => {
        //         stylus(styl)
        //             .include(require('nib').path)
        //             .render(err => {
        //                 if ( err ) throw err;
        //                 done.resolve();
        //             });
        //     }
        // },
        // {
        //     name: 'Compass',
        //     defer: true,
        //     fn: done => {
        //         const cmd = 'sass -C --compass --sourcemap=none ' + scssFile;
        //         exec('bundle exec ' + cmd, (err, stdout, stderr) => {
        //             if ( err ) throw stderr;
        //             done.resolve();
        //         });
        //     }
        // },
        {
            name: 'Stylis',
            defer: true,
            fn: done => {
                stylis('', css);
                done.resolve();
            }
        },
        {
            name:'Stylis Closure',
            defer:true,
            fn: (done) => {
                stylisClosure('', css);
                done.resolve();
            }
        }
    ]
};

const devA = path.join(__dirname, '../autoprefixer/build/lib/autoprefixer.js');
const devP = path.join(__dirname, '../postcss/build/lib/postcss.js');
if ( fs.existsSync(devA) && fs.existsSync(devP) ) {
    const devAutoprefixer = require(devA);
    const devPostcss      = require(devP);
    const devProcessor    = devPostcss([devAutoprefixer]);
    module.exports.tests.splice(0, 0, {
        name: 'Autoprefixer dev',
        defer: true,
        fn: done => {
            devProcessor.process(css, { map: false }).then(() => {
                done.resolve();
            });
        }
    });
}
