import fitz
doc = fitz.open("D:/downloads/RRH_Sonthillu_CRM_Requirements_for_Websites_v1.pdf")
text = doc[0].get_text()[:5000]
print(text)