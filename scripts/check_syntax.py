import re

with open(r'C:\Users\Admin\Desktop\واجيت\wADJET\artifacts\wadjet-grc\src\components\PolicyManagement.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('content:`[')
end = content.find('`},\n    {id:pid(2)', start)
if start != -1 and end != -1:
    snippet = content[start+9:end]
    unescaped = [m.start() for m in re.finditer(r'(?<!\\)\$\{', snippet)]
    print(f"Unescaped ${{: {len(unescaped)}")
    if unescaped:
        for pos in unescaped[:5]:
            print(f"  Position {pos}: ...{snippet[max(0,pos-20):pos+20]}...")
    print(f"Backtick count: {snippet.count('`')}")
    print(f"NCA found: {'NCA' in snippet}")
    print(f"Content starts with: {snippet[:80]}")
    print(f"Content ends with: {snippet[-80:]}")
    print(f"Content length: {len(snippet)}")
else:
    print(f"start={start}, end={end}")
