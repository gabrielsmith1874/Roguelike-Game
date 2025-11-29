"""
Generate tilesets for different zones in the roguelike.
Creates zone-specific color variations for the dungeon tileset.

Output: 16x16 pixel tilesets for each zone
"""

from PIL import Image, ImageDraw
import random
import os

# Output configuration
TILE_SIZE = 16
COLUMNS = 8
ROWS = 4
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sprites', 'depths')

# Zone color palettes
ZONE_PALETTES = {
    'catacombs': {
        'floor_base': (45, 42, 50),         # Dark purple-gray
        'floor_light': (55, 52, 62),
        'floor_dark': (35, 32, 40),
        'floor_accent': (50, 47, 58),
        'floor_highlight': (62, 58, 70),
        'wall_base': (70, 65, 80),          # Stone gray
        'wall_light': (85, 80, 95),
        'wall_dark': (50, 45, 58),
        'wall_mortar': (40, 38, 48),
        'wall_top': (90, 85, 100),
    },
    'library': {
        'floor_base': (65, 58, 45),         # Dark brown wood
        'floor_light': (78, 70, 55),
        'floor_dark': (52, 45, 35),
        'floor_accent': (72, 64, 50),
        'floor_highlight': (85, 77, 62),
        'wall_base': (95, 88, 75),          # Weathered wood
        'wall_light': (110, 103, 90),
        'wall_dark': (75, 68, 55),
        'wall_mortar': (60, 53, 40),
        'wall_top': (120, 113, 100),
    },
    'crystal_caves': {
        'floor_base': (35, 55, 75),         # Dark blue crystal
        'floor_light': (45, 70, 95),
        'floor_dark': (25, 40, 55),
        'floor_accent': (40, 62, 85),
        'floor_highlight': (55, 80, 105),
        'wall_base': (55, 75, 95),          # Light blue crystal
        'wall_light': (70, 90, 115),
        'wall_dark': (40, 55, 70),
        'wall_mortar': (30, 45, 60),
        'wall_top': (85, 105, 130),
    },
    'forge_depths': {
        'floor_base': (75, 45, 35),         # Dark red stone
        'floor_light': (90, 55, 45),
        'floor_dark': (60, 35, 25),
        'floor_accent': (82, 50, 40),
        'floor_highlight': (100, 65, 55),
        'wall_base': (95, 65, 55),          # Dark red brick
        'wall_light': (115, 80, 70),
        'wall_dark': (75, 50, 40),
        'wall_mortar': (60, 40, 30),
        'wall_top': (130, 90, 80),
    }
}

def add_noise(color, variation=8):
    """Add subtle random variation to a color."""
    return tuple(max(0, min(255, c + random.randint(-variation, variation))) for c in color)

def generate_floor_tile(variation=0, colors=None):
    """Generate a floor tile with subtle brick pattern."""
    if colors is None:
        colors = ZONE_PALETTES['catacombs']
    
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), colors['floor_base'])
    draw = ImageDraw.Draw(img)
    
    # Different floor patterns based on variation
    if variation < 4:
        # Standard stone floor with subtle grid
        for y in range(0, TILE_SIZE, 4):
            for x in range(0, TILE_SIZE, 4):
                offset = 2 if (y // 4) % 2 == 1 else 0
                x_pos = (x + offset) % TILE_SIZE
                
                base = add_noise(colors['floor_base'], 6)
                draw.rectangle([x_pos, y, x_pos + 3, y + 3], fill=base)
                
                if random.random() > 0.7:
                    draw.point((x_pos, y), fill=add_noise(colors['floor_dark'], 4))
    
    elif variation < 6:
        # Cracked stone variation
        draw.rectangle([0, 0, TILE_SIZE-1, TILE_SIZE-1], fill=add_noise(colors['floor_base'], 8))
        
        for _ in range(random.randint(1, 3)):
            start_x = random.randint(0, TILE_SIZE - 1)
            start_y = random.randint(0, TILE_SIZE - 1)
            for i in range(random.randint(3, 7)):
                nx = start_x + random.randint(-1, 1)
                ny = start_y + random.randint(0, 1)
                if 0 <= nx < TILE_SIZE and 0 <= ny < TILE_SIZE:
                    draw.point((nx, ny), fill=add_noise(colors['floor_dark'], 3))
                start_x, start_y = nx, ny
    
    else:
        # Decorative floor with slight pattern
        for y in range(TILE_SIZE):
            for x in range(TILE_SIZE):
                if (x + y) % 8 < 4:
                    color = add_noise(colors['floor_base'], 4)
                else:
                    color = add_noise(colors['floor_accent'], 4)
                draw.point((x, y), fill=color)
    
    # Add random specks for texture
    for _ in range(random.randint(5, 12)):
        px = random.randint(0, TILE_SIZE - 1)
        py = random.randint(0, TILE_SIZE - 1)
        speck_color = colors['floor_light'] if random.random() > 0.5 else colors['floor_dark']
        draw.point((px, py), fill=add_noise(speck_color, 10))
    
    return img

def generate_wall_tile(variation=0, colors=None):
    """Generate a wall tile with stone brick pattern."""
    if colors is None:
        colors = ZONE_PALETTES['catacombs']
    
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), colors['wall_base'])
    draw = ImageDraw.Draw(img)
    
    if variation == 0:
        # Standard brick wall
        brick_height = 5
        brick_width = 7
        
        for row in range(3):
            y = row * brick_height
            offset = brick_width // 2 if row % 2 == 1 else 0
            
            for col in range(-1, 3):
                x = col * brick_width + offset
                
                brick_color = add_noise(colors['wall_base'], 10)
                draw.rectangle([x + 1, y + 1, x + brick_width - 1, y + brick_height - 1], fill=brick_color)
                
                draw.line([x + 1, y + 1, x + brick_width - 2, y + 1], fill=add_noise(colors['wall_light'], 5))
                draw.line([x + 1, y + brick_height - 1, x + brick_width - 1, y + brick_height - 1], fill=add_noise(colors['wall_dark'], 5))
                draw.line([x, y, x, y + brick_height], fill=colors['wall_mortar'])
            
            draw.line([0, y, TILE_SIZE - 1, y], fill=colors['wall_mortar'])
    
    elif variation == 1:
        # Wall with moss/damage
        for y in range(0, TILE_SIZE, 5):
            offset = 4 if (y // 5) % 2 == 1 else 0
            for x in range(-4, TILE_SIZE, 8):
                bx = x + offset
                draw.rectangle([bx + 1, y + 1, bx + 6, y + 4], fill=add_noise(colors['wall_base'], 8))
                draw.line([bx, y, bx + 7, y], fill=colors['wall_mortar'])
            draw.line([0, y, TILE_SIZE - 1, y], fill=colors['wall_mortar'])
        
        moss_color = (35, 50, 35)
        for _ in range(random.randint(2, 4)):
            mx = random.randint(0, TILE_SIZE - 3)
            my = random.randint(0, TILE_SIZE - 3)
            draw.rectangle([mx, my, mx + 2, my + 2], fill=add_noise(moss_color, 15))
    
    elif variation == 2:
        # Cracked wall
        for y in range(0, TILE_SIZE, 5):
            offset = 4 if (y // 5) % 2 == 1 else 0
            for x in range(-4, TILE_SIZE, 8):
                bx = x + offset
                draw.rectangle([bx + 1, y + 1, bx + 6, y + 4], fill=add_noise(colors['wall_base'], 12))
        
        crack_color = (30, 28, 35)
        cx, cy = random.randint(4, 12), random.randint(4, 12)
        for _ in range(random.randint(4, 8)):
            nx = cx + random.choice([-1, 0, 1])
            ny = cy + random.choice([0, 1])
            if 0 <= nx < TILE_SIZE and 0 <= ny < TILE_SIZE:
                draw.point((nx, ny), fill=crack_color)
            cx, cy = nx, ny
    
    else:
        # Dark/shadowed wall
        draw.rectangle([0, 0, TILE_SIZE - 1, TILE_SIZE - 1], fill=add_noise(colors['wall_dark'], 5))
        for y in range(0, TILE_SIZE, 5):
            draw.line([0, y, TILE_SIZE - 1, y], fill=colors['wall_mortar'])
            offset = 4 if (y // 5) % 2 == 1 else 0
            for x in range(offset, TILE_SIZE, 8):
                draw.line([x, y, x, y + 5], fill=colors['wall_mortar'])
    
    return img

def generate_transition_tile(tile_type, colors=None):
    """Generate wall-floor transition tiles."""
    if colors is None:
        colors = ZONE_PALETTES['catacombs']
    
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if tile_type == 'wall_bottom':
        # Wall with floor visible at bottom
        for y in range(0, 11):
            for x in range(TILE_SIZE):
                draw.point((x, y), fill=add_noise(colors['wall_base'], 6))
        
        draw.line([0, 0, TILE_SIZE - 1, 0], fill=colors['wall_mortar'])
        draw.line([0, 5, TILE_SIZE - 1, 5], fill=colors['wall_mortar'])
        draw.line([0, 10, TILE_SIZE - 1, 10], fill=colors['wall_dark'])
        
        for y in range(11, TILE_SIZE):
            shadow_alpha = int(200 - (y - 11) * 30)
            for x in range(TILE_SIZE):
                draw.point((x, y), fill=(*colors['floor_dark'][:3], max(0, shadow_alpha)))
    
    return img

def generate_zone_tileset(zone_id: str, palette: dict):
    """Generate tileset for a specific zone with its color palette."""
    
    tileset = Image.new('RGBA', (COLUMNS * TILE_SIZE, ROWS * TILE_SIZE), (0, 0, 0, 0))
    
    # Row 0-1: Floor variations (16 tiles total)
    for i in range(8):
        random.seed(42 + i)
        floor = generate_floor_tile(i % 8, palette)
        x = (i % COLUMNS) * TILE_SIZE
        y = (i // COLUMNS) * TILE_SIZE
        tileset.paste(floor, (x, y))
    
    for i in range(8):
        random.seed(100 + i)
        floor = generate_floor_tile(i % 8, palette)
        x = (i % COLUMNS) * TILE_SIZE
        y = TILE_SIZE
        tileset.paste(floor, (x, y))
    
    # Row 2: Wall tiles (8 tiles)
    for i in range(8):
        random.seed(200 + i)
        wall = generate_wall_tile(i % 4, palette)
        tileset.paste(wall, (i * TILE_SIZE, 2 * TILE_SIZE))
    
    # Row 3: Transition tiles and specials
    random.seed(300)
    tileset.paste(generate_transition_tile('wall_bottom', palette), (0, 3 * TILE_SIZE))
    
    for i in range(1, 8):
        random.seed(350 + i)
        special = generate_floor_tile((i + 2) % 8, palette)
        tileset.paste(special, (i * TILE_SIZE, 3 * TILE_SIZE))
    
    # Save the tileset
    output_path = os.path.join(OUTPUT_DIR, f'{zone_id}-tileset.png')
    tileset.save(output_path)
    print(f"Generated {zone_id} tileset: {output_path}")
    
    # Also save preview
    preview = tileset.resize((tileset.width * 4, tileset.height * 4), Image.NEAREST)
    preview_path = os.path.join(OUTPUT_DIR, f'{zone_id}-tileset-preview.png')
    preview.save(preview_path)
    
    return output_path

def main():
    """Generate tilesets for all zones."""
    print("Generating zone-specific tilesets...")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for zone_id, palette in ZONE_PALETTES.items():
        generate_zone_tileset(zone_id, palette)
    
    print("\nAll zone tilesets generated!")
    print("Zone tilesets available:")
    for zone_id in ZONE_PALETTES.keys():
        print(f"  - {zone_id}-tileset.png")

if __name__ == '__main__':
    main()
