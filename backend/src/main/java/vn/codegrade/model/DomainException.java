package vn.codegrade.model;

/** Stable application error code translated by the transport layer. */
public class DomainException extends RuntimeException {
  public final String code;

  public DomainException(String code, String message) {
    super(message);
    this.code = code;
  }
}
