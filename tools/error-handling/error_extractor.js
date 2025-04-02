/**
 * error_extractor.js
 * 
 * 从Tree-sitter生成的AST中提取错误节点
 */

const Parser = require('tree-sitter');
const TaintSummary = require('../../bindings/node');

/**
 * 从AST中提取所有错误节点
 * @param {Object} tree - Tree-sitter生成的语法树
 * @param {string} sourceCode - 原始源代码
 * @returns {Array} 错误节点数组，每个元素包含错误类型、位置和描述
 */
function extractErrors(tree, sourceCode) {
  const errors = [];
  const rootNode = tree.rootNode;
  
  // 遍历AST查找错误节点
  traverseNode(rootNode, errors, sourceCode);
  
  return errors;
}

/**
 * 递归遍历节点及其子节点，查找错误节点
 * @param {Object} node - 当前节点
 * @param {Array} errors - 错误节点数组
 * @param {string} sourceCode - 原始源代码
 */
function traverseNode(node, errors, sourceCode) {
  // 检查节点是否为错误节点
  if (node.type.startsWith('ERROR') || node.type.startsWith('MISSING') || 
      node.type.includes('error') || node.type.includes('missing') ||
      node.type.includes('invalid')) {
    
    // 获取错误节点的位置信息
    const startPosition = node.startPosition;
    const endPosition = node.endPosition;
    
    // 获取错误节点的源代码
    const errorCode = sourceCode.substring(node.startIndex, node.endIndex);
    
    // 创建错误对象
    const error = {
      type: node.type,
      startPosition: {
        row: startPosition.row,
        column: startPosition.column
      },
      endPosition: {
        row: endPosition.row,
        column: endPosition.column
      },
      code: errorCode,
      message: generateErrorMessage(node, sourceCode)
    };
    
    errors.push(error);
  }
  
  // 递归遍历子节点
  for (let i = 0; i < node.childCount; i++) {
    traverseNode(node.child(i), errors, sourceCode);
  }
}

/**
 * 根据错误节点类型生成错误信息
 * @param {Object} node - 错误节点
 * @param {string} sourceCode - 原始源代码
 * @returns {string} 错误信息
 */
function generateErrorMessage(node, sourceCode) {
  const nodeType = node.type;
  
  // 根据错误类型生成错误信息
  if (nodeType === 'missing_closing_brace' || nodeType.includes('missing_closing_brace')) {
    return '缺少闭合大括号 "}"';
  } else if (nodeType === 'missing_comma' || nodeType.includes('missing_comma')) {
    return '缺少逗号 ","';
  } else if (nodeType === 'missing_open_paren' || nodeType.includes('missing_open_paren')) {
    return '缺少左括号 "("';
  } else if (nodeType === 'missing_close_paren' || nodeType.includes('missing_close_paren')) {
    return '缺少右括号 ")"';
  } else if (nodeType === 'invalid_key' || nodeType.includes('invalid_key')) {
    return '无效的键值';
  } else if (nodeType === 'invalid_operation' || nodeType.includes('invalid_operation')) {
    return '无效的操作名';
  } else if (nodeType === 'unknown_operation_name' || nodeType.includes('unknown_operation')) {
    const operationName = sourceCode.substring(node.startIndex, node.endIndex);
    return `未知的操作名: "${operationName}"，可用的操作有: setSink, transitive, sanitize, swapTaint`;
  } else if (nodeType.includes('number_too_large')) {
    return '数字太大';
  } else if (nodeType.includes('number_too_small')) {
    return '数字太小';
  } else if (nodeType.includes('non_integer_number')) {
    return '键值必须是整数';
  } else if (nodeType.includes('invalid_number')) {
    return '无效的数字';
  } else if (nodeType.includes('error') || nodeType.includes('ERROR')) {
    return '语法错误';
  } else if (nodeType.includes('missing') || nodeType.includes('MISSING')) {
    return '缺少必要的元素';
  }
  
  return '未知错误';
}

module.exports = {
  extractErrors
};
