# Convert Markdown to PDF Script
# Requires: Python with markdown2pdf or pandoc

Write-Host "Converting USER_GUIDE.md to PDF..." -ForegroundColor Cyan

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
    
    # Install required packages
    Write-Host "Installing required Python packages..." -ForegroundColor Yellow
    python -m pip install --quiet --upgrade pip
    python -m pip install --quiet markdown-pdf
    python -m pip install --quiet weasyprint
    
    # Convert using Python
    Write-Host "Converting with Python markdown libraries..." -ForegroundColor Yellow
    
    # Create conversion script
    $conversionScript = @"
import markdown
from weasyprint import HTML, CSS
from pathlib import Path

# Read markdown file
md_file = Path('USER_GUIDE.md')
html_file = Path('USER_GUIDE.html')
pdf_file = Path('USER_GUIDE.pdf')

print(f'Reading {md_file}...')
md_content = md_file.read_text(encoding='utf-8')

# Convert markdown to HTML with extensions
html_content = markdown.markdown(
    md_content,
    extensions=['tables', 'fenced_code', 'toc', 'nl2br']
)

# Create styled HTML
styled_html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: A4;
            margin: 2cm;
            @bottom-right {{
                content: counter(page) " / " counter(pages);
            }}
        }}
        body {{
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 30px;
        }}
        h2 {{
            color: #34495e;
            border-bottom: 2px solid #95a5a6;
            padding-bottom: 8px;
            margin-top: 25px;
        }}
        h3 {{
            color: #7f8c8d;
            margin-top: 20px;
        }}
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        th {{
            background-color: #3498db;
            color: white;
        }}
        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        blockquote {{
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 20px 0;
            color: #555;
            font-style: italic;
        }}
        img {{
            max-width: 100%;
            height: auto;
        }}
        .toc {{
            background-color: #ecf0f1;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        a {{
            color: #3498db;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>
'''

print(f'Writing HTML to {html_file}...')
html_file.write_text(styled_html, encoding='utf-8')

print(f'Converting HTML to PDF...')
HTML(string=styled_html).write_pdf(pdf_file)

print(f'Successfully created {pdf_file}')
print(f'PDF size: {pdf_file.stat().st_size / 1024:.2f} KB')
"@

    $conversionScript | Out-File -FilePath "convert_to_pdf.py" -Encoding UTF8
    
    # Run conversion
    python convert_to_pdf.py
    
    if (Test-Path "USER_GUIDE.pdf") {
        Write-Host "`nSuccess! PDF created: USER_GUIDE.pdf" -ForegroundColor Green
        
        # Show file size
        $pdfSize = (Get-Item "USER_GUIDE.pdf").Length / 1KB
        Write-Host "File size: $([math]::Round($pdfSize, 2)) KB" -ForegroundColor Cyan
        
        # Open PDF
        Write-Host "`nOpening PDF..." -ForegroundColor Yellow
        Start-Process "USER_GUIDE.pdf"
    } else {
        Write-Host "Error: PDF file was not created" -ForegroundColor Red
    }
    
} catch {
    Write-Host "`nPython not found or error occurred." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nAlternative: You can use online converters:" -ForegroundColor Yellow
    Write-Host "1. https://www.markdowntopdf.com/" -ForegroundColor Cyan
    Write-Host "2. https://md2pdf.netlify.app/" -ForegroundColor Cyan
    Write-Host "3. Install Pandoc: https://pandoc.org/installing.html" -ForegroundColor Cyan
    Write-Host "`nOr use VS Code extension: 'Markdown PDF'" -ForegroundColor Cyan
}
