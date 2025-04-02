/**
 * index.js
 * 
 * Tree-sitter-dsl 错误处理工具的主入口文件
 */

const fs = require('fs');
const path = require('path');

// 尝试加载依赖
let Parser, TaintSummary;
let parserAvailable = false;

try {
  Parser = require('tree-sitter');
  // 尝试加载TaintSummary语言模块
  try {
    TaintSummary = require('../../bindings/node');
    parserAvailable = true;
  } catch (error) {
    console.warn('警告: 无法加载TaintSummary语言模块，将使用基本的语法检查');
    console.warn('错误详情:', error.message);
  }
} catch (error) {
  console.warn('警告: 无法加载tree-sitter模块，将使用基本的语法检查');
  console.warn('错误详情:', error.message);
}

// 导入错误报告工具
const { generateErrorReport } = require('./error_reporter');

// 如果可能，导入错误提取工具
let extractErrors;
if (parserAvailable) {
  extractErrors = require('./error_extractor').extractErrors;
} else {
  // 提供一个基本的错误检查功能
  extractErrors = function(_, sourceCode) {
    return basicSyntaxCheck(sourceCode);
  };
}

/**
 * 基本的语法检查，不依赖于Tree-sitter
 * @param {string} sourceCode - DSL源代码字符串
 * @returns {Array} 错误数组
 */
function basicSyntaxCheck(sourceCode) {
  const errors = [];
  const lines = sourceCode.split('\n');
  
  // 检查开始和结束大括号
  let openBraceFound = false;
  let closeBraceFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查开始大括号
    if (line.includes('{')) {
      openBraceFound = true;
    }
    
    // 检查结束大括号
    if (line.includes('}')) {
      closeBraceFound = true;
    }
    
    // 检查逗号
    if (line.includes(')') && !line.includes(',') && !line.includes('}') && i < lines.length - 1) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.startsWith('transitive') || nextLine.startsWith('setSink') || 
          nextLine.startsWith('sanitize') || nextLine.startsWith('swapTaint')) {
        errors.push({
          type: 'ERROR_MISSING_COMMA',
          message: '缺少逗号 ","',
          startPosition: { row: i, column: line.length },
          endPosition: { row: i, column: line.length },
          code: line,
          suggestion: '添加逗号 ","'
        });
      }
    }
    
    // 检查括号匹配
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    
    if (openParens > closeParens) {
      errors.push({
        type: 'ERROR_MISSING_CLOSE_PAREN',
        message: '缺少右括号 ")"',
        startPosition: { row: i, column: line.length },
        endPosition: { row: i, column: line.length },
        code: line,
        suggestion: '添加右括号 ")"'
      });
    } else if (closeParens > openParens) {
      errors.push({
        type: 'ERROR_MISSING_OPEN_PAREN',
        message: '缺少左括号 "("',
        startPosition: { row: i, column: line.indexOf(')') },
        endPosition: { row: i, column: line.indexOf(')') + 1 },
        code: line,
        suggestion: '添加左括号 "("'
      });
    }
    
    // 检查键值格式
    const keyMatches = line.match(/<([^>]+)>/g) || [];
    for (const keyMatch of keyMatches) {
      const keyContent = keyMatch.substring(1, keyMatch.length - 1);
      
      // 检查键值是否为有效数字
      if (!/^-?[0-9]$/.test(keyContent)) {
        errors.push({
          type: 'ERROR_INVALID_NUMBER',
          message: '无效的键值',
          startPosition: { row: i, column: line.indexOf(keyMatch) },
          endPosition: { row: i, column: line.indexOf(keyMatch) + keyMatch.length },
          code: keyMatch,
          suggestion: '键值必须是 -1 到 9 之间的整数'
        });
      }
    }
    
    // 检查操作名
    const operations = ['setSink', 'transitive', 'sanitize', 'swapTaint'];
    const words = line.split(/[^a-zA-Z]+/);
    
    for (const word of words) {
      if (word && !operations.includes(word) && 
          (word.includes('Sink') || word.includes('transitive') || 
           word.includes('sanitize') || word.includes('swap'))) {
        errors.push({
          type: 'ERROR_UNKNOWN_OPERATION',
          message: `未知的操作名: "${word}"`,
          startPosition: { row: i, column: line.indexOf(word) },
          endPosition: { row: i, column: line.indexOf(word) + word.length },
          code: word,
          suggestion: '使用有效的操作名: setSink, transitive, sanitize, swapTaint'
        });
      }
    }
  }
  
  // 检查是否缺少开始大括号
  if (!openBraceFound) {
    errors.push({
      type: 'ERROR_MISSING_OPEN_BRACE',
      message: '缺少开始大括号 "{"',
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 },
      code: '',
      suggestion: '添加开始大括号 "{"'
    });
  }
  
  // 检查是否缺少结束大括号
  if (!closeBraceFound) {
    errors.push({
      type: 'ERROR_MISSING_CLOSING_BRACE',
      message: '缺少闭合大括号 "}"',
      startPosition: { row: lines.length - 1, column: lines[lines.length - 1].length },
      endPosition: { row: lines.length - 1, column: lines[lines.length - 1].length },
      code: '',
      suggestion: '添加闭合大括号 "}"'
    });
  }
  
  return errors;
}

/**
 * 解析DSL文件并生成错误报告
 * @param {string} filePath - DSL文件路径
 * @param {Object} options - 选项
 * @returns {Object} 包含错误报告、错误数组和语法树的对象
 */
function analyzeDSLFile(filePath, options = {}) {
  // 读取文件内容
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  
  return analyzeDSLString(sourceCode, { ...options, filePath });
}

/**
 * 解析DSL字符串并生成错误报告
 * @param {string} sourceCode - DSL源代码字符串
 * @param {Object} options - 选项
 * @returns {Object} 包含错误报告、错误数组和语法树的对象
 */
function analyzeDSLString(sourceCode, options = {}) {
  let tree = null;
  
  // 使用Tree-sitter解析源代码
  if (parserAvailable) {
    const parser = new Parser();
    parser.setLanguage(TaintSummary);
    tree = parser.parse(sourceCode);
  }
  
  // 提取错误
  const errors = extractErrors(tree, sourceCode);
  
  // 生成错误报告
  const report = generateErrorReport(errors, sourceCode, options.filePath || '未知文件');
  
  return {
    report,
    errors,
    tree
  };
}

/**
 * 可视化显示AST
 * @param {Object} tree - Tree-sitter生成的语法树
 * @returns {string} AST的字符串表示
 */
function visualizeAST(tree) {
  if (!tree) {
    return 'AST不可用，请确保Tree-sitter已正确安装';
  }
  return tree.rootNode.toString();
}

// 直接运行此脚本，作为命令行工具使用
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法: node index.js <dsl文件路径>');
    process.exit(0);
  }
  
  const filePath = args[0];
  
  try {
    const { report, errors } = analyzeDSLFile(filePath);
    
    console.log(report);
    
    if (errors.length === 0) {
      console.log('恭喜！没有发现语法错误。');
    } else {
      console.log(`共发现 ${errors.length} 个错误。`);
    }
  } catch (error) {
    console.error('分析过程中发生错误:', error.message);
    process.exit(1);
  }
}

module.exports = {
  analyzeDSLFile,
  analyzeDSLString,
  visualizeAST,
  parserAvailable
};
