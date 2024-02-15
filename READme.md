download project with git clone
```bash
git clone
```
# Usage 
download all dependencies
```bash
npm install
```
build project
```bash
npm run build
```
run project
```bash
npm start
```

# Introduction
- The project is a simple web application that allows users to detect the car in the video.
- The user can upload a video and the application will detect the car in the video.

# Setup
- The project is built with React, Node.js, and Express.js.

- Base start
step 1: Create a project folder and setup npm.
```bash
mkdir my-project && cd my-project
npm init -y
```
step 2: Install Webpack.
```bash
npm i --save-dev webpack webpack-cli webpack-dev-server
```
step 3: Install Bootstrap version 5.3
```bash
npm i --save bootstrap @popperjs/core
```
step 4: Install additional dependencies.
```bash
npm i --save-dev autoprefixer css-loader postcss-loader sass sass-loader style-loader
```
- Project structure
```bash
mkdir {dist,src,src/js,src/scss}
touch dist/index.html src/js/main.js src/scss/styles.scss webpack.config.js
```
```bash
my-project/
├── dist/
│   └── index.html
├── src/
│   ├── js/
│   │   └── main.js
│   └── scss/
│       └── styles.scss
├── package-lock.json
├── package.json
└── webpack.config.js
```
- Configuration Webpack
```bash
const miniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')
const fs = require('fs')


// get all the folder
const entryPoints = {};
const srcDirs = fs.readdirSync('./src', { withFileTypes: true });
const srcSubdirs = srcDirs.filter(dirent => dirent.isDirectory());

console.log(srcSubdirs)
// [
//   Dirent { name: 'assets', path: './src', [Symbol(type)]: 2 },
//   Dirent { name: 'js', path: './src', [Symbol(type)]: 2 },
//   Dirent { name: 'scss', path: './src', [Symbol(type)]: 2 }
// ]
srcSubdirs.forEach(dir => {
  const dirPath = path.join(__dirname, 'src', dir.name);
  const files = fs.readdirSync(dirPath);
  if (dir.name !== 'assets') {
    files.forEach(file => {
      const entryName = file.replace(/\..+$/, '');
      entryPoints[`${dir.name}\/${entryName}`] = path.join(dirPath, file);
      // }
    }); 
  }
})
console.log(entryPoints)

module.exports = {
  entry: entryPoints,
  plugins: [
    new miniCssExtractPlugin(
      {
        filename: '[name].css'
      }
    ),
    new CopyWebpackPlugin(
      {
        patterns:[
          {from: "node_modules/onnxruntime-web/dist/*.wasm",to  : "[name][ext]"},
        ]
      }
    )
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    assetModuleFilename: "assets/img/icons/[name][ext]",
    library: {
      
      type: "umd"
    }
  },
  devServer: {
    static: path.resolve(__dirname, 'public'),
    port: 8080,
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: [
          {
            // loader: 'style-loader',
            // Extracts CSS for each JS file that includes CSS
            loader: miniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: () => [
                  require('autoprefixer')
                ]
              }
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        include: path.resolve(__dirname, "src"),
        type: 'asset/resource',
        generator: {
          filename: "assets/img/icons/[name][ext]",
        }
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: true }
          }
        ]
      },
      { test: /\.ts$/, loader: "ts-loader" },  
      { test: /\.node$/, use: "node-loader"}
    ]
  }
}
```