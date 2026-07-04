import docx

doc = docx.Document(r'C:\Users\Admin\Desktop\واجيت\New folder\Access_Control_Policy_v1.7 (1).docx')

lines = []
for p in doc.paragraphs:
    t = p.text.strip()
    if t:
        lines.append(t)

full = '\n'.join(lines)
full = full.replace('\\', '\\\\')
full = full.replace('`', '\\`')
full = full.replace('${', '\\${')

with open(r'C:\Users\Admin\Desktop\واجيت\New folder\policy_escaped.txt', 'w', encoding='utf-8') as f:
    f.write(full)

print(f'Written {len(full)} chars')
