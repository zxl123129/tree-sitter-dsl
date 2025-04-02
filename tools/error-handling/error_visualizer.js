/**
 * error_visualizer.js
 * 
 * 可视化显示错误位置和错误信息
 */

/**
 * 生成可视化的错误显示
 * @param {Array} errors - 错误节点数组
 * @param {string} sourceCode - 原始源代码
 * @returns {string} 可视化的错误显示
 */
function visualizeErrors(errors, sourceCode) {
  if (errors.length === 0) {
    return '没有发现语法错误';
  }
  
  const lines = sourceCode.split('\n');
  let visualization = '';
  
 
  errors.forEach((error, index) => {
    // 错误位置信息
    const startLine = error.startPosition.row;
    const startColumn = error.startPosition.column;
    const endLine = error.endPosition.row;
    const endColumn = error.endPosition.column;
    
    // 创建错误指示器
    visualization += `\n错误 #${index + 1}: ${error.message}\n\n`;
    
    // 显示错误上下文（最多显示3行）
    const contextStart = Math.max(0, startLine - 1);
    const contextEnd = Math.min(lines.length - 1, endLine + 1);
    
    for (let i = contextStart; i <= contextEnd; i++) {
      const lineNum = (i + 1).toString().padStart(4, ' ');
      visualization += `${lineNum} | ${lines[i]}\n`;
      
      // 如果这是错误所在行，添加错误指示器
      if (i >= startLine && i <= endLine) {
        let indicator = ' '.repeat(7 + startColumn) + '^';
        
        if (i === startLine && i === endLine) {
          // 如果错误在同一行，使用多个^指示错误范围
          const errorLength = endColumn - startColumn;
          if (errorLength > 1) {
            indicator = ' '.repeat(7 + startColumn) + '^' + '~'.repeat(errorLength - 1);
          }
        } else if (i === startLine) {
          // 错误开始行
          indicator = ' '.repeat(7 + startColumn) + '^' + '~'.repeat(lines[i].length - startColumn);
        } else if (i === endLine) {
          // 错误结束行
          indicator = ' '.repeat(7) + '~'.repeat(endColumn);
        } else {
          // 错误中间行
          indicator = ' '.repeat(7) + '~'.repeat(lines[i].length);
        }
        
        visualization += `${indicator}\n`;
      }
    }
    
    // 添加修复建议
    if (error.suggestion) {
      visualization += `\n建议: ${error.suggestion}\n`;
    }
    
    visualization += '\n' + '-'.repeat(50) + '\n';
  });
  
  return visualization;
}

/**
 * 生成HTML格式的错误可视化
 * @param {Array} errors - 错误节点数组
 * @param {string} sourceCode - 原始源代码
 * @returns {string} HTML格式的错误可视化
 */
function visualizeErrorsHTML(errors, sourceCode) {
  if (errors.length === 0) {
    return '<div class="no-errors">没有发现语法错误</div>';
  }
  
  const lines = sourceCode.split('\n');
  let html = '<div class="error-visualization">';
  

  errors.forEach((error, index) => {
    // 错误位置信息
    const startLine = error.startPosition.row;
    const startColumn = error.startPosition.column;
    const endLine = error.endPosition.row;
    const endColumn = error.endPosition.column;
    
    // 创建错误指示器
    html += `<div class="error">
      <h3>错误 #${index + 1}: ${escapeHTML(error.message)}</h3>
      <div class="error-context">`;
    
    // 显示错误上下文（最多显示3行）
    const contextStart = Math.max(0, startLine - 1);
    const contextEnd = Math.min(lines.length - 1, endLine + 1);
    
    for (let i = contextStart; i <= contextEnd; i++) {
      const lineNum = (i + 1).toString().padStart(4, ' ');
      const isErrorLine = i >= startLine && i <= endLine;
      
      html += `<div class="code-line ${isErrorLine ? 'error-line' : ''}">
        <span class="line-number">${lineNum}</span>
        <span class="line-content">${escapeHTML(lines[i])}</span>
      </div>`;
      
      // 如果这是错误所在行，添加错误指示器
      if (isErrorLine) {
        let indicator = ' '.repeat(startColumn) + '^';
        
        if (i === startLine && i === endLine) {
          // 如果错误在同一行，使用多个^指示错误范围
          const errorLength = endColumn - startColumn;
          if (errorLength > 1) {
            indicator = ' '.repeat(startColumn) + '^' + '~'.repeat(errorLength - 1);
          }
        } else if (i === startLine) {
          // 错误开始行
          indicator = ' '.repeat(startColumn) + '^' + '~'.repeat(lines[i].length - startColumn);
        } else if (i === endLine) {
          // 错误结束行
          indicator = '~'.repeat(endColumn);
        } else {
          // 错误中间行
          indicator = '~'.repeat(lines[i].length);
        }
        
        html += `<div class="error-indicator">
          <span class="line-number">&nbsp;</span>
          <span class="indicator">${indicator}</span>
        </div>`;
      }
    }
    
    // 添加修复建议
    if (error.suggestion) {
      html += `<div class="suggestion">建议: ${escapeHTML(error.suggestion)}</div>`;
    }
    
    html += `</div></div>`;
  });
  
  html += '</div>';
  
  return html;
}

/**
 * 转义HTML特殊字符
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  visualizeErrors,
  visualizeErrorsHTML
};
