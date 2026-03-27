#!/usr/bin/env python3
"""Post-export script: inject PWA meta tags and copy public assets into dist/"""
import os, shutil, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
PUBLIC = os.path.join(ROOT, 'public')

# Copy public/ assets into dist/
for f in glob.glob(os.path.join(PUBLIC, '*')):
    shutil.copy2(f, DIST)
    print(f'  copied {os.path.basename(f)}')

# Fix index.html
index_path = os.path.join(DIST, 'index.html')
with open(index_path, 'r') as f:
    html = f.read()

# Fix viewport for iOS safe areas
html = html.replace(
    'width=device-width, initial-scale=1, shrink-to-fit=no',
    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
)

# Add PWA tags if not already present
if 'apple-mobile-web-app-capable' not in html:
    pwa_tags = """  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="PDQ">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">"""
    html = html.replace('<meta name="theme-color"', pwa_tags + '\n  <meta name="theme-color"')

# Add safe-area CSS
safe_area_css = """
      /* Safe area for iOS notch/home indicator */
      html, body {
        background: #0f172a;
        -webkit-user-select: none;
        user-select: none;
      }
      body {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      }"""

html = html.replace('</style>', safe_area_css + '\n    </style>')

with open(index_path, 'w') as f:
    f.write(html)

print('Post-export complete')
