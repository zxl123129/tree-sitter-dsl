/**
 * run_tests.js
 * 
 * 运行测试用例并验证错误处理功能
 */

const fs = require('fs');
const path = require('path');
const { analyzeDSLFile } = require('./index');


const testCasesDir = path.join(__dirname, 'test-cases');


const testCaseFiles = fs.readdirSync(testCasesDir)
  .filter(file => file.endsWith('.txt'))
  .map(file => path.join(testCasesDir, file));

console.log(`找到 ${testCaseFiles.length} 个测试用例文件\n`);


testCaseFiles.forEach(filePath => {
  const fileName = path.basename(filePath);
  console.log(`===== 测试用例: ${fileName} =====`);
  
  try {
    const { report, errors } = analyzeDSLFile(filePath);
    
    console.log(report);
    
    if (errors.length === 0) {
      console.log('没有发现语法错误。');
    } else {
      console.log(`共发现 ${errors.length} 个错误。`);
    }
  } catch (error) {
    console.error('分析过程中发生错误:', error.message);
  }
  
  console.log('\n');
});

console.log('所有测试用例运行完毕。');
