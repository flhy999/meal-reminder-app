"""Generate app icons for the meal reminder PWA."""
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__))

def draw_icon(size, filename):
    """Draw a meal reminder app icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background: rounded square with orange gradient feel
    margin = int(size * 0.05)
    radius = int(size * 0.22)
    
    # Draw rounded rectangle background
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(255, 107, 53, 255)  # #FF6B35
    )
    
    # Draw a lighter circle in upper right for depth
    circle_r = int(size * 0.15)
    cx, cy = int(size * 0.72), int(size * 0.28)
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r],
        fill=(255, 143, 94, 255)  # lighter orange
    )
    
    # Draw a white plate (circle)
    plate_r = int(size * 0.28)
    pcx, pcy = int(size * 0.5), int(size * 0.52)
    draw.ellipse(
        [pcx - plate_r, pcy - plate_r, pcx + plate_r, pcy + plate_r],
        fill=(255, 255, 255, 255)
    )
    
    # Inner plate ring
    inner_r = int(size * 0.22)
    draw.ellipse(
        [pcx - inner_r, pcy - inner_r, pcx + inner_r, pcy + inner_r],
        outline=(255, 200, 170, 180),
        width=max(1, int(size * 0.015))
    )
    
    # Draw fork on left (simplified)
    fork_x = int(size * 0.30)
    fork_top = int(size * 0.28)
    fork_bot = int(size * 0.72)
    fork_w = max(2, int(size * 0.025))
    # Fork handle
    draw.rounded_rectangle(
        [fork_x - fork_w//2, fork_top + int(size*0.08), fork_x + fork_w//2, fork_bot],
        radius=max(1, fork_w//2),
        fill=(255, 255, 255, 255)
    )
    # Fork prongs
    prong_h = int(size * 0.1)
    prong_w = max(2, int(size * 0.015))
    for offset in [-int(size*0.025), 0, int(size*0.025)]:
        draw.rounded_rectangle(
            [fork_x + offset - prong_w//2, fork_top, fork_x + offset + prong_w//2, fork_top + prong_h],
            radius=max(1, prong_w//2),
            fill=(255, 255, 255, 255)
        )
    
    # Draw chopsticks on right (simplified - two lines)
    for offset in [int(size*0.04), int(size*0.07)]:
        x = int(size * 0.68) + offset
        draw.rounded_rectangle(
            [x - fork_w//2, int(size*0.25), x + fork_w//2, int(size*0.75)],
            radius=max(1, fork_w//2),
            fill=(255, 255, 255, 255),
        )
    
    img.save(os.path.join(OUTPUT_DIR, filename))
    print(f"Generated {filename} ({size}x{size})")

# Generate icons
draw_icon(192, 'icon-192.png')
draw_icon(512, 'icon-512.png')
draw_icon(180, 'apple-touch-icon.png')
draw_icon(32, 'favicon-32.png')

# Also create a maskable icon (with padding for safe zone)
def draw_maskable_icon(size, filename):
    """Draw a maskable icon with full bleed background."""
    img = Image.new('RGBA', (size, size), (255, 107, 53, 255))
    draw = ImageDraw.Draw(img)
    
    # Lighter circle for depth
    circle_r = int(size * 0.12)
    cx, cy = int(size * 0.78), int(size * 0.22)
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r],
        fill=(255, 143, 94, 255)
    )
    
    # White plate (centered, slightly smaller for safe zone)
    plate_r = int(size * 0.25)
    pcx, pcy = int(size * 0.5), int(size * 0.5)
    draw.ellipse(
        [pcx - plate_r, pcy - plate_r, pcx + plate_r, pcy + plate_r],
        fill=(255, 255, 255, 255)
    )
    
    inner_r = int(size * 0.19)
    draw.ellipse(
        [pcx - inner_r, pcy - inner_r, pcx + inner_r, pcy + inner_r],
        outline=(255, 200, 170, 180),
        width=max(1, int(size * 0.012))
    )
    
    img.save(os.path.join(OUTPUT_DIR, filename))
    print(f"Generated {filename} ({size}x{size})")

draw_maskable_icon(512, 'icon-maskable-512.png')

print("All icons generated!")
