#!/usr/bin/env python3
import fitz
doc = fitz.open("D:/downloads/RRH_Sonthillu_Websites_PRD_Blueprint_v1.pdf")
full_text = ""
for i in range(len(doc)):
    full_text += doc[i].get_text("text") + "\n\n"
with open("D:/HYD/RRH PWA/Websites_PRd_blueprint_v1_full.txt", "w", encoding="utf-8") as f:
    f.write(full_text)
print("Full text saved. Length:", len(full_text))