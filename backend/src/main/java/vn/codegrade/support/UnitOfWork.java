package vn.codegrade.support;

import java.util.function.Supplier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import vn.codegrade.repository.TransactionRepository;

/** A transaction finishes before controllers send an ACK or event. */
@Component
public class UnitOfWork {
  private final TransactionTemplate transactions;
  private final TransactionRepository locks;

  public UnitOfWork(TransactionTemplate transactions, TransactionRepository locks) {
    this.transactions = transactions;
    this.locks = locks;
  }

  public <T> T serialized(String scope, Supplier<T> action) {
    return transactions.execute(
        status -> {
          locks.lock(scope);
          return action.get();
        });
  }

  public <T> T read(Supplier<T> action) {
    var read = new TransactionTemplate(transactions.getTransactionManager());
    read.setReadOnly(true);
    // One coherent committed view for composite snapshots, without a write mutex.
    read.setIsolationLevel(
        org.springframework.transaction.TransactionDefinition.ISOLATION_REPEATABLE_READ);
    return read.execute(status -> action.get());
  }
}
