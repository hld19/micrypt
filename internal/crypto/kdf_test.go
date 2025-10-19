package crypto

import "testing"

func TestApplyPIMIncrementSuccess(t *testing.T) {
	next, err := applyPIMIncrement(3, 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if next != 8 {
		t.Fatalf("expected 8 got %d", next)
	}
}

func TestApplyPIMIncrementOverflow(t *testing.T) {
	_, err := applyPIMIncrement(^uint32(0)-1, 2)
	if err == nil {
		t.Fatal("expected overflow error")
	}
}

func TestApplyPIMIncrementTooLarge(t *testing.T) {
	_, err := applyPIMIncrement(3, maxPIMIncrement+1)
	if err == nil {
		t.Fatal("expected size error")
	}
}
