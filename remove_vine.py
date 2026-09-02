import re

html_path = r'c:\Users\luisa\OneDrive\Desktop\invitacion\frontend\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()


html = re.sub(r'<svg class="vine-border".*?</svg>', '', html, flags=re.DOTALL)
html = re.sub(r'<div class="text-content">\s*(.*?)\s*</div>', r'\1', html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Removed vine border SVG")
