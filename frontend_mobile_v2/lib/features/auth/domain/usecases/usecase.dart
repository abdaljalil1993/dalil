/// Base class for every use case: `call()` in, `Result` out.
/// No Flutter, no Dio, no Riverpod inside domain.
abstract class UseCase<T, P> {
  const UseCase();
  Future<T> call(P params);
}

/// Same, for parameters-free operations.
abstract class UseCaseNoParams<T> {
  const UseCaseNoParams();
  Future<T> call();
}
