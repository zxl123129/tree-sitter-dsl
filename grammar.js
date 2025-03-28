module.exports = grammar({
  name: 'TaintSummary',

  conflicts: $ => [
    [$.error_operation],
    [$.error_token, $.set_sink],
    [$.error_token, $.transitive],
    [$.error_token, $.sanitize],
    [$.error_token, $.swap_taint],
    [$.misplaced_paren_open, $.set_sink],
    [$.misplaced_paren_open, $.transitive],
    [$.misplaced_paren_open, $.sanitize],
    [$.misplaced_paren_open, $.swap_taint]
  ],

  precedences: $ => [
    [
      'error',
      'token',
      'operation'
    ]
  ],

  rules: {
    // 整个污点摘要的根规则
    taint_summary: $ => seq(
      '{',
      optional($.side_effects),
      field('closing_brace', choice(
        '}',
        alias($.missing_closing_brace, 'ERROR: Missing closing brace "}"')
      ))
    ),

    // SideEffects 规则：匹配多个 TaintSideEffect，或者为空
    side_effects: $ => seq(
      $.taint_side_effect,
      optional($.side_effects_tail)
    ),

    // SideEffects 的尾部规则：用于递归匹配多个 TaintSideEffect
    side_effects_tail: $ => seq(
      field('comma', choice(
        ',',
        alias($.missing_comma, 'ERROR: Missing comma between operations')
      )),
      $.taint_side_effect,
      optional($.side_effects_tail)
    ),

    // TaintSideEffect 规则：四种可能的操作
    taint_side_effect: $ => choice(
      prec('operation', $.set_sink),      // 提高正常操作的优先级
      prec('operation', $.transitive),
      prec('operation', $.sanitize),
      prec('operation', $.swap_taint),
      prec('error', $.error_operation)     // 降低错误操作的优先级
    ),

    // 错误操作：只在无法匹配正常操作时才匹配
    error_operation: $ => prec.dynamic(-1, choice(
      // 1. 已知操作名的错误
      seq(
        field('operation_name', choice(
          'setSink',
          'transitive',
          'sanitize',
          'swapTaint'
        )),
        field('error_parts', $.error_parts)
      ),
      // 2. 未知操作名
      seq(
        field('unknown_operation', $.unknown_operation_name),
        optional(field('error_parts', $.error_parts))
      )
    )),

    unknown_operation_name: $ => token(/[a-zA-Z]+/),

    // 错误部分
    error_parts: $ => prec.right(1, repeat1(choice(
      $.key,
      $.error_token,
      $.whitespace_error
    ))),

    whitespace_error: $ => token(/\s+/),

    // 错误标记
    error_token: $ => prec('token', choice(
      $.misplaced_paren_open,
      $.misplaced_paren_close,
      $.misplaced_comma
    )),

    misplaced_paren_open: $ => prec('token', token('(')),
    misplaced_paren_close: $ => prec('token', token(')')),
    misplaced_comma: $ => prec('token', token(',')),

    // Key 规则
    key: $ => seq(
      field('open_angle', '<'),
      field('number', choice(
        '-1', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        $.invalid_number
      )),
      field('close_angle', '>')
    ),

    // 无效数字规则
    invalid_number: $ => choice(
      $.number_too_large,
      $.number_too_small,
      $.non_integer_number,
      $.invalid_number_char
    ),

    number_too_large: $ => token(/[0-9]{2,}/),
    number_too_small: $ => token(/-[0-9]{2,}/),
    non_integer_number: $ => token(/[0-9]+\.[0-9]+/),
    invalid_number_char: $ => token(/[^0-9-]/),

    // 错误类型定义
    missing_closing_brace: $ => token('ERROR_MISSING_CLOSING_BRACE'),
    missing_comma: $ => token('ERROR_MISSING_COMMA'),
    missing_open_paren: $ => token('ERROR_MISSING_OPEN_PAREN'),
    missing_close_paren: $ => token('ERROR_MISSING_CLOSE_PAREN'),
    invalid_key: $ => token('ERROR_INVALID_KEY'),
    invalid_operation: $ => token('ERROR_INVALID_OPERATION'),

    // 正确的操作定义
    set_sink: $ => seq(
      'setSink',
      '(',
      $.key,
      ')'
    ),

    transitive: $ => seq(
      'transitive',
      '(',
      $.key,
      ',',
      $.key,
      ')'
    ),

    sanitize: $ => seq(
      'sanitize',
      '(',
      $.key,
      ')'
    ),

    swap_taint: $ => seq(
      'swapTaint',
      '(',
      $.key,
      ',',
      $.key,
      ')'
    )
  }
});