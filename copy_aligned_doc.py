import shutil
import time
import os

src = r"c:\laragon\www\DSAMS\(GQAMS) Chapter 3 Revisions (MS_Word) (7)_Aligned.docx"
dst = r"c:\laragon\www\DSAMS\(GQAMS) Chapter 3 Revisions (MS_Word) (7).docx"

print("Waiting to copy aligned document once Word releases the file lock...")
try:
    shutil.copyfile(src, dst)
    print("SUCCESS: Target document has been updated with the aligned version!")
except PermissionError:
    print("NOTE: The file is still currently open in Microsoft Word.")
    print("Please save and close Word, then run this script or let the assistant know to replace it.")
