import os
import re

dir_path = 'src'

replacements = [
    (r'bg-navy-950/[0-9]+', 'bg-background'),
    (r'bg-navy-900/[0-9]+', 'bg-surface'),
    (r'bg-navy-950', 'bg-background'),
    (r'bg-navy-900', 'bg-surface'),
    (r'bg-navy-800', 'bg-surface-hover'),
    (r'text-navy-950', 'text-background'),
    (r'text-gold-400', 'text-accent-500'),
    (r'text-gold-500', 'text-accent-600'),
    (r'from-gold-400', 'from-accent-400'),
    (r'to-gold-500', 'to-accent-500'),
    (r'to-gold-600', 'to-accent-600'),
    (r'to-gold-300', 'to-accent-400'),
    (r'shadow-gold-[0-9]+/[0-9]+', 'shadow-accent-500/20'),
    (r'border-gold-[0-9]+/[0-9]+', 'border-accent-500/20'),
    (r'bg-gold-[0-9]+/[0-9]+', 'bg-accent-500/10'),
    (r'border-white/10', 'border-border'),
    (r'hover:bg-white/5', 'hover:bg-surface-hover'),
]

for root, _, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content)
                
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file_path}")

print("Done replacing colors!")
