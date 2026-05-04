import random
import re

MAX_NOTATION_LENGTH = 256
MAX_TERMS = 50
ALLOWED_PATTERN = re.compile(r"^[\d\+d\-]+$")
TERM_PATTERN = re.compile(r"([+-])((?:\d+)?d\d+|\d+)")


def parse_and_roll(dice_notation: str) -> dict:
    if len(dice_notation) > MAX_NOTATION_LENGTH:
        raise ValueError("Формула слишком длинная.")

    clean_notation = dice_notation.lower().replace(" ", "")
    if not clean_notation:
        raise ValueError("Формула не может быть пустой.")

    if not ALLOWED_PATTERN.match(clean_notation):
        raise ValueError("Недопустимые символы в формуле. Используйте только цифры, 'd', '+', '-' (например: 1d20, 2d6+3, 1d8-1)")

    if clean_notation[0] not in "+-":
        clean_notation = "+" + clean_notation

    matches = TERM_PATTERN.findall(clean_notation)

    if not matches:
        raise ValueError("Формула не распознана. Примеры: 1d20, 2d6+3, 1d8-1, 3d4+2-1")
    if len(matches) > MAX_TERMS:
        raise ValueError("Слишком много элементов в формуле.")

    total = 0
    all_rolls = []
    total_modifier = 0

    for sign, value in matches:
        multiplier = 1 if sign == "+" else -1

        if "d" in value:
            num_dice_raw, dice_sides_raw = value.split("d", maxsplit=1)
            num_dice = int(num_dice_raw) if num_dice_raw else 1
            dice_sides = int(dice_sides_raw)

            if num_dice > 100 or dice_sides > 1000:
                raise ValueError("Слишком много кубиков (макс. 100) или граней (макс. 1000)!")
            if num_dice <= 0 or dice_sides <= 0:
                raise ValueError("Количество кубиков и граней должно быть больше 0.")

            current_rolls = [random.randint(1, dice_sides) for _ in range(num_dice)]
            sum_rolls = sum(current_rolls) * multiplier
            total += sum_rolls

            all_rolls.append({"dice": f"{sign}{value}", "rolls": current_rolls, "sum": sum_rolls})
        else:
            mod = int(value) * multiplier
            total_modifier += mod
            total += mod

    return {
        "notation": dice_notation,
        "rolls_detail": all_rolls,
        "modifier": total_modifier,
        "total": total,
    }
