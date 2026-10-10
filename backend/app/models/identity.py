from enum import StrEnum


class ApplicationRole(StrEnum):
    PASSENGER = "PASSENGER"
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"


class DriverVerificationStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# These are domain names, not implemented authorization or onboarding flows.
