import sys
sys.path.append(".")
from app.tools.pdf_generator import generate_pdf_report

data = {
    "projectName": "Test Project",
    "targetUrl": "https://example.com",
    "environment": "Testing Env",
    "tech_stack": ["React", "FastAPI"],
    "bugs": [
        {
            "id": "BUG-01",
            "severity": "HIGH",
            "page": "/login",
            "description": "Validation error button fails",
            "recommendation": "Fix selector"
        }
    ],
    "explorer_output": {
        "discovered_links": ["https://example.com/page1", "https://example.com/page2"]
    }
}

try:
    generate_pdf_report(data, "test_out.pdf")
    print("PDF generated successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
