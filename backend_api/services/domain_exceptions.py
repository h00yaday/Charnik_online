class DomainError(Exception):
    """Base class for domain/application errors."""


class EntityNotFoundError(DomainError):
    pass


class AccessDeniedError(DomainError):
    pass


class ValidationDomainError(DomainError):
    pass
