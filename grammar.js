module.exports = grammar({
  name: 'TaintSummary',

  rules: {
    // 整个污点摘要的根规则
    taint_summary: $ => seq(
      '{',
      $.side_effects,
      '}'
    ),

    // SideEffects 规则：可以是空的（Φ）或由多个 TaintSideEffect 组成
    side_effects: $ => choice(
      'Φ', // 空集
      seq($.taint_side_effect, $.side_effects) // 递归定义
    ),

    // TaintSideEffect 规则：四种可能的操作
    taint_side_effect: $ => choice(
      seq('setSink', '(', $.key, ')'), // setSink(Key)
      seq('transitive', '(', $.key, ',', $.key, ')'), // transitive(Key1, Key2)
      seq('sanitize', '(', $.key, ')'), // sanitize(Key)
      seq('swapTaint', '(', $.key, ',', $.key, ')') // swapTaint(Key1, Key2)
    ),

    // Key 规则：表示 -1 到 9 的整数
    key: $ => choice(
      '-1', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    )
  }
});