import os, re, glob

base = "D:/HYD/RRH PWA"
s = open(base + "/prisma/schema.prisma", encoding="utf-8").read()
models = re.findall(r"^model (\w+)", s, re.M)
enums = re.findall(r"^enum (\w+)", s, re.M)
print("MODEL_COUNT", len(models))
print("MODELS", ", ".join(models))
print("ENUMS", ", ".join(enums))

attrs = ["source", "campaign", "utm_source", "utm_medium", "utm_campaign"]
for m in models:
    mm = re.search(r"model " + m + r" \{(.*?)\n\}", s, re.S)
    if not mm:
        continue
    block = mm.group(0)
    present = [a for a in attrs if re.search(r"^\s+" + a + r" \w+", block, re.M)]
    if present:
        print("ATTR[%s]: %s" % (m, ", ".join(present)))

print("=== MIGRATION ATTR GREP ===")
for pth in glob.glob(base + "/prisma/migrations/*/migration.sql"):
    t = open(pth, encoding="utf-8", errors="replace").read()
    hits = [a for a in attrs if re.search(r"\b" + a + r"\b", t)]
    if hits:
        nm = pth.split("migrations")[1].split(os.sep)[1]
        print(nm, "->", ", ".join(hits))
print("=== DONE ===")
