import re
with open(r'C:\Users\Admin\Desktop\واجيت\wADJET\artifacts\wadjet-grc\src\components\PolicyManagement.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
match = re.search(r"content:\`(.*?)\`\s*\},\s*\{id:pid\(2\),", content, re.DOTALL)
if match:
    txt = match.group(1)
    print(f'Current content length: {len(txt)} chars')
    print('---FIRST 500---')
    print(txt[:500])
    print('---LAST 500---')
    print(txt[-500:])
else:
    print('not found')
