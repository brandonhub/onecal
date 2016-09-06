# OneCal

### First time server setup
 - `pip install virtualenv`
 - `virtualenv ~/Envs/onecal`

### Server operation
 - `source ~/Envs/onecal`
 - `pip install -r requirements.txt` (in onecal base directory)

### Strategy for PDF parsing
 - Run PDF doc through HTML converter
 - Remove blank tds
 - For absolutely positioned, non structured elements (i.e. no table structure), we need to imply a table structure (e.g. trs exist when their left and right x coordinates match with the next tr). Can have even further confidence when immediate children are same between trs
 - To link pages, find trs at the same depth and splice them into the table on the first page