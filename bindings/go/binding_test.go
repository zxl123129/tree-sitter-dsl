package tree_sitter_taint_summary_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_taint_summary "github.com/tree-sitter/tree-sitter-taint_summary/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_taint_summary.Language())
	if language == nil {
		t.Errorf("Error loading TaintSummary grammar")
	}
}
