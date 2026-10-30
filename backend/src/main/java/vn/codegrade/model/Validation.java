package vn.codegrade.model;

public final class Validation {
  private Validation() {}

  public static void require(boolean valid, String message) {
    if (!valid) throw new DomainException("VALIDATION", message);
  }
}
