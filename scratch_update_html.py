import re

with open(r'c:\Users\luisa\OneDrive\Desktop\invitacion\frontend\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_tree = """        <div class="tree-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;">
            <canvas id="canvas"></canvas>
            <button id="reiniciar" style="position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%); padding: 10px 22px; border: none; border-radius: 25px; background: rgba(255, 255, 255, .75); backdrop-filter: blur(8px); color: #5b4937; font-size: 15px; cursor: pointer; box-shadow: 0 5px 20px rgba(0, 0, 0, .12); z-index: 100;">
                🌱 Volver a crecer
            </button>
            <div class="message">
                Crece con amor ♡
            </div>
        </div>"""

content = re.sub(r'<div class="tree-container">.*?</div>\s*</section>', new_tree + '\n\n    </section>', content, flags=re.DOTALL)

with open(r'c:\Users\luisa\OneDrive\Desktop\invitacion\frontend\index.html', 'w', encoding='utf-8') as f:
    f.write(content)
