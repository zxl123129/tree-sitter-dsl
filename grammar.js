module.exports = grammar({
  name: 'TaintSummary',

  rules: {
    // 整个污点摘要的根规则
    taint_summary: $ => seq(
      '{',
      optional($.side_effects), // 允许 side_effects 为空
      '}'
    ),

    // SideEffects 规则：匹配多个 TaintSideEffect，或者为空
    side_effects: $ => seq(
      $.taint_side_effect,
      optional($.side_effects_tail) // 递归定义
    ),

    // SideEffects 的尾部规则：用于递归匹配多个 TaintSideEffect
    side_effects_tail: $ => seq(
      ',',
      $.taint_side_effect,
      optional($.side_effects_tail)
    ),

    // TaintSideEffect 规则：四种可能的操作
    taint_side_effect: $ => choice(
      seq('setSink', '(', $.key, ')'), // setSink(Key)
      seq('transitive', '(', $.key, ',', $.key, ')'), // transitive(Key1, Key2)
      seq('sanitize', '(', $.key, ')'), // sanitize(Key)
      seq('swapTaint', '(', $.key, ',', $.key, ')') // swapTaint(Key1, Key2)
    ),

    // Key 规则：表示 <-1>, <0>, <1>, ..., <9>
    key: $ => seq(
      '<',
      choice('-1', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
      '>'
    )
  }
});