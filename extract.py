#!/usr/bin/env python3
import fitz, sys, io
doc = fitz.open("D:/downloads/RRH_Sonthillu_CRM_Requirements_for_Websites_v1.pdf")
text = doc[0].get_text("text")
# Truncate at 5000 chars and encode-decode safely
text = text[:5000]
print(text.encode('utf-8', errors='replace').decode('cp1252', errors='replace'))