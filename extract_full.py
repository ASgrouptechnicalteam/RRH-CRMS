#!/usr/bin/env python3
import fitz, sys, io
doc = fitz.open("D:/downloads/RRH_Sonthillu_CRM_Requirements_for_Websites_v1.pdf")
full_text = ""
for i in range(len(doc)):
    full_text += doc[i].get_text("text") + "\n\n"
# Save to file for analysis
with open("D:/HYD/RRH PWA/CRM_requirements_v1_full.txt", "w", encoding="utf-8") as f:
    f.write(full_text)
print("Full text saved. Length:", len(full_text))