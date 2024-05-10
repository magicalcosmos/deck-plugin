const { series, parallel, src, dest } = require('gulp');
const fs = require('fs');
const path = require('path');
const rename = require('gulp-rename'); 
const uglify = require('uglify-js');
const through2 = require('through2');
const replace = require('gulp-replace');

const dir = '../resources';


function clean(cb) {
    try {
        fs.rmdirSync(dir, { recursive: true });
    } catch(err) {
        console.log(`删除或创建目录时发生错误：${err}`);

    }
    typeof cb === 'function' && cb();
}

function css() {
    return src('src/css/*')
    .pipe(dest(`${dir}/css`));
}

function images() {
    return src('src/images/*')
    .pipe(dest(`${dir}/images`));
}

function js() {
    return src('src/**/*.js')
    .pipe(rename(function(file) {
        file.dirname = `${dir}/js`;
    }))
    .pipe(dest(dir));
}

function minifyJs(a) {
}

function pages() {
    return src('src/pages/**/*.html')
    .pipe(rename(function(file) {
        console.log(file);
        file.dirname = dir;
    }))
    .pipe(dest(dir));
}

function addTimestamp() {
    // 正则表达式匹配<script>和<link>标签的src属性  
    const regex = /(<(?:script|link)\b[^>]*(\bsrc\s｜\bhref\s)*=\s*(["'])(?!data:)(.*?)(?<!\?)\2[^>]*>)/gi;
    return src(`${dir}/**/*.html`)
    .pipe(replace(regex, function(match){
        let srcAttr;
        if (match.indexOf('link') !== -1) {
            // 提取src属性的值（不包括引号）  
            srcAttr = /<link\s+[^>]*?href\s*=\s*['"]([^'"]+)['"][^>]*>/.exec(match)[1];
        }
        if (match.indexOf('script') !== -1) {
            srcAttr = /src\s*=\s*(["'])(.*?)\1/.exec(match)[2];
        }
        

        // 如果src属性已经有参数，添加一个&分隔符；否则添加一个?  
        const separator = srcAttr.includes('?') ? '&' : '?';  
        // 构造新的src属性值，添加时间戳参数  
        const newSrcAttr = srcAttr + separator + 'v=' + Date.now();  
        // 替换src属性值为新的带有时间戳的值  
        return match.replace(srcAttr, newSrcAttr);
    }))
    .pipe(dest(dir));
}

if (process.env.NODE_ENV === 'production') {
    exports.build = series(clean, parallel(css, images, js, pages), addTimestamp);
} else {
    exports.build = series(clean, parallel(css, images, js, pages), addTimestamp);
}