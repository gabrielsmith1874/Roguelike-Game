"""
Generate dungeon tileset in Enter the Gungeon style.
Creates floor and wall tile variations for non-repetitive dungeon rendering.

Output: 16x16 pixel tiles in a tileset PNG
- Rows 0-1: Floor variations (8 tiles) - dark stone with subtle patterns
- Row 2: Wall tiles (4 tiles) - stone brick walls
- Row 3: Special tiles (transitions, corners)
"""

from PIL import Image, ImageDraw
import random
import os

# Output configuration
TILE_SIZE = 16
COLUMNS = 8
ROWS = 4
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sprites', 'depths')

# Color palette (Enter the Gungeon inspired - dark dungeon theme)
COLORS = {
    # Floor colors - dark brown stone (matching reference image)
    'floor_base': (58, 48, 42),         # Dark brown base
    'floor_light': (72, 60, 52),        # Lighter brown stone
    'floor_dark': (42, 35, 30),         # Darker cracks/shadows
    'floor_accent': (65, 54, 46),       # Mid-tone variation
    'floor_highlight': (78, 66, 58),    # Subtle highlights
    
    # Wall colors - gray stone brick
    'wall_base': (85, 82, 88),          # Light gray stone base
    'wall_light': (105, 100, 108),      # Highlights
    'wall_dark': (62, 58, 68),          # Shadows/mortar
    'wall_mortar': (48, 45, 52),        # Dark mortar lines
    'wall_top': (115, 110, 120),        # Top edge highlight
}


def add_noise(color, variation=8):
    """Add subtle random variation to a color."""
    return tuple(max(0, min(255, c + random.randint(-variation, variation))) for c in color)


def draw_stone_pattern(draw, x, y, w, h, base_color, light_color, dark_color):
    """Draw a subtle stone texture pattern."""
    # Base fill
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=base_color)
    
    # Add subtle variations
    for _ in range(random.randint(3, 6)):
        px = x + random.randint(0, w - 2)
        py = y + random.randint(0, h - 2)
        size = random.randint(1, 3)
        color = light_color if random.random() > 0.5 else dark_color
        draw.rectangle([px, py, px + size, py + size], fill=add_noise(color, 5))


def generate_floor_tile(variation=0):
    """Generate a floor tile with subtle brick pattern."""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), COLORS['floor_base'])
    draw = ImageDraw.Draw(img)
    
    # Different floor patterns based on variation
    if variation < 4:
        # Standard stone floor with subtle grid
        for y in range(0, TILE_SIZE, 4):
            for x in range(0, TILE_SIZE, 4):
                # Offset every other row for brick pattern
                offset = 2 if (y // 4) % 2 == 1 else 0
                x_pos = (x + offset) % TILE_SIZE
                
                # Draw subtle stone block
                base = add_noise(COLORS['floor_base'], 6)
                draw.rectangle([x_pos, y, x_pos + 3, y + 3], fill=base)
                
                # Subtle crack/mortar lines
                if random.random() > 0.7:
                    draw.point((x_pos, y), fill=add_noise(COLORS['floor_dark'], 4))
    
    elif variation < 6:
        # Cracked stone variation
        draw.rectangle([0, 0, TILE_SIZE-1, TILE_SIZE-1], fill=add_noise(COLORS['floor_base'], 8))
        
        # Add crack lines
        for _ in range(random.randint(1, 3)):
            start_x = random.randint(0, TILE_SIZE - 1)
            start_y = random.randint(0, TILE_SIZE - 1)
            for i in range(random.randint(3, 7)):
                nx = start_x + random.randint(-1, 1)
                ny = start_y + random.randint(0, 1)
                if 0 <= nx < TILE_SIZE and 0 <= ny < TILE_SIZE:
                    draw.point((nx, ny), fill=add_noise(COLORS['floor_dark'], 3))
                start_x, start_y = nx, ny
    
    else:
        # Decorative floor with slight pattern
        for y in range(TILE_SIZE):
            for x in range(TILE_SIZE):
                # Create checkerboard-like subtle pattern
                if (x + y) % 8 < 4:
                    color = add_noise(COLORS['floor_base'], 4)
                else:
                    color = add_noise(COLORS['floor_accent'], 4)
                draw.point((x, y), fill=color)
    
    # Add random specks for texture
    for _ in range(random.randint(5, 12)):
        px = random.randint(0, TILE_SIZE - 1)
        py = random.randint(0, TILE_SIZE - 1)
        speck_color = COLORS['floor_light'] if random.random() > 0.5 else COLORS['floor_dark']
        draw.point((px, py), fill=add_noise(speck_color, 10))
    
    return img


def generate_wall_tile(variation=0):
    """Generate a wall tile with stone brick pattern."""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), COLORS['wall_base'])
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
                
                # Draw brick
                brick_color = add_noise(COLORS['wall_base'], 10)
                draw.rectangle([x + 1, y + 1, x + brick_width - 1, y + brick_height - 1], fill=brick_color)
                
                # Top highlight
                draw.line([x + 1, y + 1, x + brick_width - 2, y + 1], fill=add_noise(COLORS['wall_light'], 5))
                
                # Bottom shadow
                draw.line([x + 1, y + brick_height - 1, x + brick_width - 1, y + brick_height - 1], fill=add_noise(COLORS['wall_dark'], 5))
                
                # Mortar
                draw.line([x, y, x, y + brick_height], fill=COLORS['wall_mortar'])
            
            # Horizontal mortar
            draw.line([0, y, TILE_SIZE - 1, y], fill=COLORS['wall_mortar'])
    
    elif variation == 1:
        # Wall with moss/damage
        # Base brick pattern
        for y in range(0, TILE_SIZE, 5):
            offset = 4 if (y // 5) % 2 == 1 else 0
            for x in range(-4, TILE_SIZE, 8):
                bx = x + offset
                draw.rectangle([bx + 1, y + 1, bx + 6, y + 4], fill=add_noise(COLORS['wall_base'], 8))
                draw.line([bx, y, bx + 7, y], fill=COLORS['wall_mortar'])
            draw.line([0, y, TILE_SIZE - 1, y], fill=COLORS['wall_mortar'])
        
        # Add moss/damage spots
        moss_color = (35, 50, 35)
        for _ in range(random.randint(2, 4)):
            mx = random.randint(0, TILE_SIZE - 3)
            my = random.randint(0, TILE_SIZE - 3)
            draw.rectangle([mx, my, mx + 2, my + 2], fill=add_noise(moss_color, 15))
    
    elif variation == 2:
        # Cracked wall
        # Base pattern
        for y in range(0, TILE_SIZE, 5):
            offset = 4 if (y // 5) % 2 == 1 else 0
            for x in range(-4, TILE_SIZE, 8):
                bx = x + offset
                draw.rectangle([bx + 1, y + 1, bx + 6, y + 4], fill=add_noise(COLORS['wall_base'], 12))
        
        # Add cracks
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
        draw.rectangle([0, 0, TILE_SIZE - 1, TILE_SIZE - 1], fill=add_noise(COLORS['wall_dark'], 5))
        for y in range(0, TILE_SIZE, 5):
            draw.line([0, y, TILE_SIZE - 1, y], fill=COLORS['wall_mortar'])
            offset = 4 if (y // 5) % 2 == 1 else 0
            for x in range(offset, TILE_SIZE, 8):
                draw.line([x, y, x, y + 5], fill=COLORS['wall_mortar'])
    
    return img


def generate_transition_tile(tile_type):
    """Generate wall-floor transition tiles."""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if tile_type == 'wall_bottom':
        # Wall with floor visible at bottom (shadow edge)
        # Top 2/3 is wall
        for y in range(0, 11):
            for x in range(TILE_SIZE):
                draw.point((x, y), fill=add_noise(COLORS['wall_base'], 6))
        
        # Add brick pattern to wall portion
        draw.line([0, 0, TILE_SIZE - 1, 0], fill=COLORS['wall_mortar'])
        draw.line([0, 5, TILE_SIZE - 1, 5], fill=COLORS['wall_mortar'])
        draw.line([0, 10, TILE_SIZE - 1, 10], fill=COLORS['wall_dark'])
        
        # Bottom shadow/transition
        for y in range(11, TILE_SIZE):
            shadow_alpha = int(200 - (y - 11) * 30)
            for x in range(TILE_SIZE):
                draw.point((x, y), fill=(*COLORS['floor_dark'], max(0, shadow_alpha)))
    
    elif tile_type == 'floor_shadow_n':
        # Floor with north shadow (wall above)
        draw.rectangle([0, 0, TILE_SIZE - 1, TILE_SIZE - 1], fill=COLORS['floor_base'])
        # Gradient shadow at top
        for y in range(5):
            alpha = 150 - y * 30
            draw.line([0, y, TILE_SIZE - 1, y], fill=(*COLORS['floor_dark'][:3], max(0, alpha)))
    
    return img


def generate_tileset():
    """Generate the complete tileset image."""
    tileset = Image.new('RGBA', (COLUMNS * TILE_SIZE, ROWS * TILE_SIZE), (0, 0, 0, 0))
    
    # Row 0-1: Floor variations (16 tiles total for variety)
    for i in range(8):
        random.seed(42 + i)  # Reproducible but varied
        floor = generate_floor_tile(i % 8)
        x = (i % COLUMNS) * TILE_SIZE
        y = (i // COLUMNS) * TILE_SIZE
        tileset.paste(floor, (x, y))
    
    # More floor variations in row 1
    for i in range(8):
        random.seed(100 + i)
        floor = generate_floor_tile(i % 8)
        x = (i % COLUMNS) * TILE_SIZE
        y = TILE_SIZE
        tileset.paste(floor, (x, y))
    
    # Row 2: Wall tiles (4 main + 4 variants)
    for i in range(4):
        random.seed(200 + i)
        wall = generate_wall_tile(i)
        tileset.paste(wall, (i * TILE_SIZE, 2 * TILE_SIZE))
    
    # More wall variants
    for i in range(4):
        random.seed(250 + i)
        wall = generate_wall_tile(i % 4)
        tileset.paste(wall, ((i + 4) * TILE_SIZE, 2 * TILE_SIZE))
    
    # Row 3: Transition tiles and specials
    random.seed(300)
    tileset.paste(generate_transition_tile('wall_bottom'), (0, 3 * TILE_SIZE))
    tileset.paste(generate_transition_tile('floor_shadow_n'), (TILE_SIZE, 3 * TILE_SIZE))
    
    # Additional special floor tiles (corner shadows, etc.)
    for i in range(2, 8):
        random.seed(350 + i)
        special = generate_floor_tile((i + 2) % 8)
        tileset.paste(special, (i * TILE_SIZE, 3 * TILE_SIZE))
    
    return tileset


def main():
    """Generate and save the tileset."""
    print("Generating Enter the Gungeon style tileset...")
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Generate tileset
    tileset = generate_tileset()
    
    # Save tileset
    output_path = os.path.join(OUTPUT_DIR, 'tileset.png')
    tileset.save(output_path)
    print(f"Saved tileset to: {output_path}")
    
    # Also save a scaled preview (4x)
    preview = tileset.resize((tileset.width * 4, tileset.height * 4), Image.NEAREST)
    preview_path = os.path.join(OUTPUT_DIR, 'tileset-preview.png')
    preview.save(preview_path)
    print(f"Saved preview to: {preview_path}")
    
    # Update metadata
    metadata = {
        "name": "Depths Tileset",
        "tileWidth": TILE_SIZE,
        "tileHeight": TILE_SIZE,
        "columns": COLUMNS,
        "rows": ROWS,
        "tiles": {
            "floor": {
                "indices": list(range(16)),
                "description": "Floor tile variations"
            },
            "wall": {
                "indices": list(range(16, 24)),
                "description": "Wall tile variations"
            },
            "transition": {
                "indices": list(range(24, 32)),
                "description": "Transition and special tiles"
            }
        }
    }
    
    import json
    metadata_path = os.path.join(OUTPUT_DIR, 'tileset-metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to: {metadata_path}")
    
    print(f"\nTileset layout ({COLUMNS}x{ROWS} = {COLUMNS * ROWS} tiles):")
    print("  Row 0: Floor variations 0-7")
    print("  Row 1: Floor variations 8-15")
    print("  Row 2: Wall variations 0-7")
    print("  Row 3: Transitions and specials")


if __name__ == '__main__':
    main()
