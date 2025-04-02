/**
 * error_reporter.js
 * 
 * 生成格式化的错误报告
 */

/**
 * 生成错误报告
 * @param {Array} errors - 错误节点数组
 * @param {string} sourceCode - 原始源代码
 * @param {string} filePath - 源代码文件路径
 * @returns {string} 格式化的错误报告
 */
function generateErrorReport(errors, sourceCode, filePath) {
  if (errors.length === 0) {
    return '没有发现语法错误';
  }
  
  const lines = sourceCode.split('\n');
  let report = `在文件 ${filePath || '未知文件'} 中发现 ${errors.length} 个错误:\n\n`;
  
  errors.forEach((error, index) => {
    // 错误位置信息
    const startLine = error.startPosition.row + 1; 
    const startColumn = error.startPosition.column + 1;
    const endLine = error.endPosition.row + 1;
    const endColumn = error.endPosition.column + 1;
    
    // 错误代码行
    const codeLine = lines[error.startPosition.row];
    
    // 错误指示器
    let indicator = ' '.repeat(error.startPosition.column) + '^';
    if (error.endPosition.row === error.startPosition.row) {
      // 如果错误在同一行，使用多个^指示错误范围
      const errorLength = error.endPosition.column - error.startPosition.column;
      if (errorLength > 1) {
        indicator = ' '.repeat(error.startPosition.column) + '^' + '~'.repeat(errorLength - 1);
      }
    }
    
    // 错误报告
    report += `错误 #${index + 1}: ${error.message}\n`;
    report += `位置: 第 ${startLine} 行, 第 ${startColumn} 列\n`;
    report += `代码: ${codeLine}\n`;
    report += `      ${indicator}\n`;
    
    // 修复建议
    const suggestion = generateFixSuggestion(error, sourceCode);
    if (suggestion) {
      report += `建议: ${suggestion}\n`;
    }
    
    report += '\n';
  });
  
  return report;
}

/**
 * 生成修复建议
 * @param {Object} error - 错误对象
 * @param {string} sourceCode - 原始源代码
 * @returns {string} 修复建议
 */
function generateFixSuggestion(error, sourceCode) {
  const errorType = error.type;
  
  if (errorType === 'missing_closing_brace' || errorType.includes('missing_closing_brace')) {
    return '添加闭合大括号 "}"';
  } else if (errorType === 'missing_comma' || errorType.includes('missing_comma')) {
    return '添加逗号 ","';
  } else if (errorType === 'missing_open_paren' || errorType.includes('missing_open_paren')) {
    return '添加左括号 "("';
  } else if (errorType === 'missing_close_paren' || errorType.includes('missing_close_paren')) {
    return '添加右括号 ")"';
  } else if (errorType === 'invalid_key' || errorType.includes('invalid_key')) {
    return '键值必须是 -1 到 9 之间的整数，格式为 <n>';
  } else if (errorType === 'invalid_operation' || errorType.includes('invalid_operation')) {
    return '使用有效的操作名: setSink, transitive, sanitize, swapTaint';
  } else if (errorType === 'unknown_operation_name' || errorType.includes('unknown_operation')) {
    const operationName = error.code;
    // 查找最相似的操作名
    const operations = ['setSink', 'transitive', 'sanitize', 'swapTaint'];
    const similarOp = findMostSimilarString(operationName, operations);
    return `未知的操作名: "${operationName}"，您是否想使用 "${similarOp}"？`;
  } else if (errorType.includes('number_too_large')) {
    return '键值必须是 -1 到 9 之间的整数';
  } else if (errorType.includes('number_too_small')) {
    return '键值必须是 -1 到 9 之间的整数';
  } else if (errorType.includes('non_integer_number')) {
    return '键值必须是整数，不能包含小数点';
  } else if (errorType.includes('invalid_number')) {
    return '键值必须是 -1 到 9 之间的整数';
  }
  
  return '';
}

/**
 * 查找最相似的字符串
 * @param {string} target - 目标字符串
 * @param {Array} candidates - 候选字符串数组
 * @returns {string} 最相似的字符串
 */
function findMostSimilarString(target, candidates) {
  let bestMatch = candidates[0];
  let bestScore = levenshteinDistance(target, candidates[0]);
  
  for (let i = 1; i < candidates.length; i++) {
    const score = levenshteinDistance(target, candidates[i]);
    if (score < bestScore) {
      bestScore = score;
      bestMatch = candidates[i];
    }
  }
  
  return bestMatch;
}

/**
 * 计算两个字符串之间的编辑距离
 * @param {string} s1 - 第一个字符串
 * @param {string} s2 - 第二个字符串
 * @returns {number} 编辑距离
 */
function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  
  // 创建距离矩阵
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // 初始化第一行和第一列
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // 填充距离矩阵
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }
  
  return dp[m][n];
}

module.exports = {
  generateErrorReport
};
