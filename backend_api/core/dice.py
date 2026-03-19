import re
import random

def parse_and_roll(dice_notation: str) -> dict:
    clean_notation = dice_notation.lower().replace(" ", "")
    
    pattern = r"^(\d+)d(\d+)(?:([+-])(\d+))?$"
    match = re.match(pattern, clean_notation)
    
    if not match:
        raise ValueError("Неверный формат. Используйте формат NdM+K, например 1d20+5 или 2d6")
    
    num_dice = int(match.group(1))
    dice_sides = int(match.group(2))
    
    rolls = [random.randint(1, dice_sides) for _ in range(num_dice)]
    total = sum(rolls)

    modifier = 0
    if match.group(3) and match.group(4):
        mod_sign = match.group(3)
        mod_value = int(match.group(4))
        
        modifier = mod_value if mod_sign == "+" else -mod_value
        total += modifier
        
    return {
        "notation": clean_notation,
        "rolls": rolls,
        "modifier": modifier,
        "total": total
    }