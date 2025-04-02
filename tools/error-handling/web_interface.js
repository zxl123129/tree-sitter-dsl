/**
 * 
 * 
 * Web界面可视化显示错误信息
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { analyzeDSLString } = require('./index');
const { visualizeErrorsHTML } = require('./error_visualizer');

const app = express();
const port = 3000;

// 设置中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const publicDir = path.join(__dirname, 'public');
const viewsDir = path.join(__dirname, 'views');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

if (!fs.existsSync(viewsDir)) {
  fs.mkdirSync(viewsDir);
}

// 创建CSS文件
const cssContent = `
body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
  text-align: center;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

textarea {
  width: 100%;
  height: 200px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  resize: vertical;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #45a049;
}

.error-visualization {
  margin-top: 20px;
}

.error {
  margin-bottom: 20px;
  border-left: 4px solid #f44336;
  padding-left: 15px;
}

h3 {
  color: #f44336;
  margin-top: 0;
}

.error-context {
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.code-line {
  font-family: monospace;
  white-space: pre;
  margin: 0;
}

.error-line {
  background-color: #ffebee;
}

.line-number {
  color: #999;
  display: inline-block;
  width: 40px;
  text-align: right;
  padding-right: 10px;
  user-select: none;
}

.error-indicator {
  font-family: monospace;
  white-space: pre;
  color: #f44336;
  margin: 0;
}

.indicator {
  color: #f44336;
}

.suggestion {
  margin-top: 10px;
  padding: 8px;
  background-color: #e8f5e9;
  border-left: 4px solid #4CAF50;
}

.no-errors {
  color: #4CAF50;
  font-weight: bold;
  text-align: center;
  padding: 20px;
}

.examples {
  margin-top: 20px;
}

.example-button {
  background-color: #2196F3;
  margin-right: 10px;
  margin-bottom: 10px;
}

.example-button:hover {
  background-color: #0b7dda;
}

.clear-button {
  background-color: #f44336;
}

.clear-button:hover {
  background-color: #d32f2f;
}
`;

fs.writeFileSync(path.join(publicDir, 'style.css'), cssContent);

// 创建HTML模板
const indexTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaintSummary DSL 错误检查器</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <h1>TaintSummary DSL 错误检查器</h1>
    
    <form action="/analyze" method="post">
      <div class="form-group">
        <label for="dsl-code">输入 TaintSummary DSL 代码:</label>
        <textarea id="dsl-code" name="dslCode" placeholder="在这里输入 DSL 代码..."><%= dslCode %></textarea>
      </div>
      
      <div class="form-group">
        <button type="submit">分析代码</button>
        <button type="button" class="clear-button" onclick="clearCode()">清空</button>
      </div>
      
      <div class="examples">
        <h3>示例:</h3>
        <button type="button" class="example-button" onclick="loadExample('example1')">示例 1: 缺少闭合大括号</button>
        <button type="button" class="example-button" onclick="loadExample('example2')">示例 2: 未知操作名</button>
        <button type="button" class="example-button" onclick="loadExample('example3')">示例 3: 缺少逗号</button>
        <button type="button" class="example-button" onclick="loadExample('example4')">示例 4: 缺少括号</button>
        <button type="button" class="example-button" onclick="loadExample('example5')">示例 5: 无效键值</button>
      </div>
    </form>
    
    <% if (errorReport) { %>
      <%- errorReport %>
    <% } %>
  </div>
  
  <script>
    function clearCode() {
      document.getElementById('dsl-code').value = '';
    }
    
    function loadExample(example) {
      const textarea = document.getElementById('dsl-code');
      
      switch (example) {
        case 'example1':
          textarea.value = '{\\n  transitive(<0>, <2>),\\n  sanitize(<-1>),\\n  swapTaint(<3>, <4>)';
          break;
        case 'example2':
          textarea.value = '{\\n  setSink(<0>),\\n  transitiv(<1>, <2>),\\n  sanitize(<3>)\\n}';
          break;
        case 'example3':
          textarea.value = '{\\n  setSink(<0>)\\n  transitive(<1>, <2>),\\n  sanitize(<3>)\\n}';
          break;
        case 'example4':
          textarea.value = '{\\n  setSink(<0>),\\n  transitive(<1>, <2>,\\n  sanitize(<3>)\\n}';
          break;
        case 'example5':
          textarea.value = '{\\n  setSink(<10>),\\n  transitive(<1>, <2.5>),\\n  sanitize(<a>)\\n}';
          break;
      }
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(viewsDir, 'index.ejs'), indexTemplate);


app.get('/', (req, res) => {
  res.render('index', { dslCode: '', errorReport: '' });
});

app.post('/analyze', (req, res) => {
  const dslCode = req.body.dslCode;
  
  try {
    const { errors, tree } = analyzeDSLString(dslCode);
    const errorReport = visualizeErrorsHTML(errors, dslCode);
    
    res.render('index', { dslCode, errorReport });
  } catch (error) {
    res.render('index', { 
      dslCode, 
      errorReport: `<div class="error"><h3>分析过程中发生错误:</h3><p>${error.message}</p></div>` 
    });
  }
});

// 启动服务器
function startServer() {
  app.listen(port, () => {
    console.log(`Web界面已启动，访问 http://localhost:${port}`);
  });
}


if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};
