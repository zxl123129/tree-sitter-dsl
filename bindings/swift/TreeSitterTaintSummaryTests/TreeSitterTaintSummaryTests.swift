import XCTest
import SwiftTreeSitter
import TreeSitterTaintSummary

final class TreeSitterTaintSummaryTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_taint_summary())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading TaintSummary grammar")
    }
}
