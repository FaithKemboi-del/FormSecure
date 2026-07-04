from decimal import Decimal

GATE_VALUE_MULTIPLIER = Decimal("1.35")


def resolve_gate_value(face_value: Decimal, estimated_gate_value: Decimal | None) -> Decimal:
    if estimated_gate_value is not None and estimated_gate_value > 0:
        return estimated_gate_value
    return (face_value * GATE_VALUE_MULTIPLIER).quantize(Decimal("0.01"))


def compute_savings_vs_gate(asking_price: Decimal, gate_value: Decimal) -> Decimal:
    savings = gate_value - asking_price
    return max(savings, Decimal("0.00")).quantize(Decimal("0.01"))


def max_allowed_listing_price(face_value: Decimal) -> Decimal:
    return (face_value * Decimal("1.20")).quantize(Decimal("0.01"))


def min_allowed_listing_price(face_value: Decimal) -> Decimal:
    return face_value.quantize(Decimal("0.01"))
